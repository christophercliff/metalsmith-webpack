import {
  join,
  relative,
  sep
} from 'path'
import webpack from 'webpack'
import debug from 'debug'
import MemoryFs from 'memory-fs'
import vow from 'vow'
import {
  FileCache,
  ValueCache
} from 'metalsmith-cache'

import multimatch from 'multimatch'

const dbg = debug('metalsmith-webpack')

const modTimes = new ValueCache('webpack-mod-times')
const metaCache = new ValueCache('webpack')
const fileCache = new FileCache('webpack')

let fromCache

/**
 * ##plugin
 *
 * @param {Object} options webpack options
 */
export default function plugin (options = 'webpack.config.js', dependencies) {
  return function webpack (files, metalsmith) {
    // deal with options inside plugin so we have access to metalsmith
    if (
      typeof options === 'string' ||
      options.config === undefined
    ) options = { config: options }
    if (typeof options.config === 'string') {
      options.config = require(metalsmith.path(options.config))
    }
    if (!Array.isArray(options.config)) options.config = [options.config]

    fromCache = true

    return vow.resolve()
    .then(() => invalidate(options))
    .then(() => validateCache(dependencies, files))
    .catch((reason) => transpile(reason, options, metalsmith))
    .then(() => populate(files, metalsmith))
    .catch(dbg)
  }
}

function invalidate (options) {
  if (options.clearCache || options.invalidate) {
    return vow.all([
      modTimes.invalidate(),
      fileCache.invalidate(),
      metaCache.invalidate()
    ])
  }
}

function validateCache (dependencies, files) {
  if (!dependencies) return vow.reject('no dependencies specified')
  if (process.env.NODE_ENV === 'production') {
    return vow.reject('production build')
  }

  dependencies = [].concat(dependencies)
  dependencies = multimatch(Object.keys(files), dependencies)
  if (dependencies.length === 0) {
    return vow.reject('dependencies matched 0 files')
  }
  const resolvers = dependencies.map((file) => {
    const current = files[file].stats.mtime.getTime()
    return vow.resolve()
    .then(() => modTimes.retrieve(file))
    .then((cached) => {
      if (cached !== current) return vow.reject()
    })
  })
  return vow.all(resolvers)
  .then(() => {
    dbg('cache valid, skipping transpile')
  })
  .catch(() => {
    return vow.resolve()
    .then(() => modTimes.invalidate())
    .then(() => {
      // you can't just do this as part of the above resolver structure,
      // because only the first updated time would be stored, then the structure
      // would reject.
      const resolvers = dependencies.map((file) => {
        return modTimes.store(file, files[file].stats.mtime.getTime())
      })
      return vow.all(resolvers)
    })
    .then(() => fileCache.invalidate())
    .then(() => vow.reject('dependencies changed'))
  })
}

function transpile (reason, options, metalsmith) {
  dbg(`cache invalid (will transpile): ${reason}`)

  const compiler = webpack(options.config)
  const fs = new MemoryFs()
  compiler.outputFileSystem = fs

  fromCache = false

  return promisify(compiler.run.bind(compiler))()
  .then((stats) => {
    if (stats.hasErrors()) throw new Error(stats)
    return metaCache.store('statsDisplay', stats.toString(options.stats))
    .then(() => metaCache.store('stats', stats.toJson()))
    .then(() => {
      dbg('stored')
      // *assetsByChunkName* will have a property for each chunkName from
      // all children, containing an array of buildPaths for assets
      const assetsByChunkName = {}

      // the async writes to cache don't need to complete before the next
      // iteration, so each write operation can be stored in an array, then
      // at the end wrap all those ops in vow.all
      const resolvers = []

      // this doesn't actually output json, rather a plain object
      stats = stats.toJson()
      // *iterate over `stats.children` array*
      // there will be one child for each config, if you're passing in an array
      // need to access assets from stats.children[idx] and output path from
      // config[idx].output.path so iterate over keys rather than `for in` style
      Object.keys(stats.children).forEach((childIdx) => {
        const child = stats.children[childIdx]
        const outputPath = options.config[childIdx].output.path

        // *iterate over `assetsByChunkName` property*
        // I think a chunk is roughly equivalent to an entry point (not sure?)
        // so if you set several entry points, you'll have corresponding
        // assets for each chunk name
        Object.keys(child.assetsByChunkName).forEach((chunkName) => {
          assetsByChunkName[chunkName] = []
          // [].concat ensures array
          let assets = [].concat(child.assetsByChunkName[chunkName])
          assets.forEach((assetName) => {
            // fullPath (absolute) to asset, as it's stored in memory
            const fullPath = join(outputPath, assetName)
            // buildPath (relative) path to asset as it will be stored in ms
            const buildPath = relative(metalsmith.destination(), fullPath)
            // store file in cache
            resolvers.push(
              fileCache.store(buildPath, {contents: fs.readFileSync(fullPath)})
            )
            // store buildPath
            assetsByChunkName[chunkName].push(buildPath)
          })
        })
      })
      resolvers.push(metaCache.store('assetsByChunkName', assetsByChunkName))
      return vow.all(resolvers)
      .then(() => vow.resolve(assetsByChunkName))
    })
  })
}

function populate (files, metalsmith) {
  let assetsByChunkName
  let meta
  let stats
  return vow.resolve()
  .then(() => metaCache.retrieve('assetsByChunkName'))
  .then((result) => {
    assetsByChunkName = result
    const resolvers = []
    Object.values(assetsByChunkName).forEach((assets) => {
      resolvers.concat(assets.map((asset) => {
        return fileCache.retrieve(asset)
        .then((file) => {
          // dbg(Object.keys(file.contents))
          files[asset] = file
        })
      }))
    })
    return vow.all(resolvers)
  })
  .then(() => metaCache.retrieve('stats'))
  .then((result) => {
    stats = Object.assign(result, {fromCache})
    meta = metalsmith.metadata()

    // one chunk may have multiple assets, in meta we're just going to
    // store the path to the last asset. Probably wont work for all uses.
    const assets = {}
    Object.keys(assetsByChunkName).forEach((chunkName) => {
      assets[chunkName] = join(sep, assetsByChunkName[chunkName].slice(-1).join())
    })
    meta.webpack = { stats, assets }
    // dump this to show consumers whats in the meta / assets structure
    dbg(assets)
  })
  .then(() => metaCache.retrieve('statsDisplay'))
  .then((result) => {
    // dump stats
    dbg(result)
  })
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
