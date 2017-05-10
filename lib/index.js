import {
  join,
  relative
} from 'path'
import webpack from 'webpack'
import debug from 'debug'
import MemoryFs from 'memory-fs'
import vow from 'vow'

const dbg = debug('metalsmith-webpack')

/**
 * ##plugin
 *
 * @param {Object} options webpack options
 */
export default function plugin (options) {
  return function (files, metalsmith) {
    // deal with options inside plugin so we have access to metalsmith
    if (!options) options = 'webpack.config.js'
    if (
      typeof options === 'string' ||
      options.config === undefined
    ) options = { config: options }
    if (typeof options.config === 'string') {
      options.config = require(metalsmith.path(options.config))
    }
    if (!Array.isArray(options.config)) options.config = [options.config]

    // instantiate compiler & memory-fs
    const compiler = webpack(options.config)
    const fs = new MemoryFs()
    compiler.outputFileSystem = fs

    return promisify(compiler.run.bind(compiler))()
    .then((stats) => {
      if (stats.hasErrors()) throw new Error(stats)
      const meta = metalsmith.metadata()
      meta.webpack = {stats, assets: {}}

      // show plugin users the standard webpack stats
      dbg('webpack stats')
      dbg(stats.toString(options.stats))

      // defenestrate stats object
      stats = stats.toJson() // scandalous !!

      // *iterate over `stats.children` array*
      // there will be one child for each config, if you're passing in an array
      // need to access assets from stats.children[idx] and output path from
      // config[idx].output.path so iterate over keys rather than `for in` style
      Object.keys(stats.children).forEach((childIdx) => {
        const child = stats.children[childIdx]
        dbg(child.assetsByChunkName)
        const outputPath = options.config[childIdx].output.path

        // *iterate over `assetsByChunkName` property*
        // I think a chunk is roughly equivalent to an entry point (not sure?)
        // so if you set several entry points, you'll have corresponding
        // assets for each chunk name
        Object.keys(child.assetsByChunkName).forEach((chunkName) => {
          // [].concat ensures array
          let assets = [].concat(child.assetsByChunkName[chunkName])

          assets = assets.map((assetName) => {
            // fullPath (absolute) to asset, as it's stored in memory
            const fullPath = join(outputPath, assetName)
            // buildPath (relative) path to asset as it will be stored in ms
            const buildPath = relative(metalsmith.destination(), fullPath)
            // read output file to metalsmith files
            files[buildPath] = {
              contents: fs.readFileSync(fullPath),
              webpackStats: stats // kill this
            }
            return buildPath
          })

          // store a reference in meta for use in templates. Depending in
          // webpack config, we might generate multiple files for one entry
          // point or chunk or whatever.
          // by mapping files array to buildPath's we can just pop the last one
          // to store in meta, I'm not sure if that will be appropriate for
          // all use cases, but it's all I've got for now.
          meta.webpack.assets[chunkName] = assets.pop()
        })
      })

      // show plugin users what their meta structure looks like
      dbg('meta (webpack.assets)')
      dbg(meta.webpack.assets)
      return vow.resolve()
    })
  }
}

/**
 * ## promisify
 * wrap fn with promise.. should probably use some package
 */
function promisify (fn) {
  return function (...args) {
    const defer = vow.defer()

    args.push((err, result) => {
      if (err) return defer.reject(err)
      defer.resolve(result)
    })
    try {
      fn.apply(this, args)
    } catch (err) {
      defer.reject(err)
    }
    return defer.promise()
  }
}
