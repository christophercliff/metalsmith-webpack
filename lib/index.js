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
  ValueCache,
  loki,
  init as initCache,
  save as saveCache
} from 'metalsmith-cache'

// import {
//   readFile
// } from 'fs'
import multimatch from 'multimatch'

const dbg = debug('metalsmith-webpack')
const modTimes = new ValueCache('webpack-mod-times')
const persist = new ValueCache('webpack-values')
const fileCache = new FileCache('webpack-files')

export { loki as cache }

let fromCache

/**
 * ##plugin
 *
 * @param {Object} options webpack options
 */
export default function plugin (options = 'webpack.config.js', dependencies) {
  return function (files, metalsmith) {
    // deal with options inside plugin so we have access to metalsmith
    if (
      typeof options === 'string' ||
      options.config === undefined
    ) options = { config: options }
    if (typeof options.config === 'string') {
      options.config = require(metalsmith.path(options.config))
    }
    if (!Array.isArray(options.config)) options.config = [options.config]

    if (options.clearCache) {
      modTimes.collection.clear()
      fileCache.collection.clear()
      persist.collection.clear()
    }
    fromCache = true

    return vow.resolve()
    .then(() => initCache())
    .then(() => validateCache(dependencies, files))
    .catch((reason) => transpile(reason, options, metalsmith))
    .then(() => populate(files, metalsmith))
    .catch(dbg)
    .then(() => saveCache())
  }
}

function validateCache (dependencies, files) {
  if (!dependencies) return vow.reject('no dependencies specified')

  dependencies = [].concat(dependencies)
  let results = multimatch(Object.keys(files), dependencies).map((file) => {
    const current = files[file].stats.mtime.getTime()
    const cached = modTimes.retrieve(file)
    if (cached === current) return false
    modTimes.store(file, current)
    return true
  })
  if (results.includes(true)) return vow.reject('dependencies changed')
  if (results.length === 0) return vow.reject('dependencies matched 0 files')
  dbg('cache valid, skipping transpile')
  return vow.resolve()
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
    persist.store('statsDisplay', stats.toString(options.stats))
    stats = stats.toJson() // scandalous !!
    persist.store('stats', stats)

    // *assetsByChunkName* will have a property for each chunkName from
    // all children, containing an array of buildPaths for assets
    const assetsByChunkName = {}

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
          fileCache.store(buildPath, {contents: fs.readFileSync(fullPath)})
          // store buildPath
          assetsByChunkName[chunkName].push(buildPath)
        })
      })
    })
    persist.store('assetsByChunkName', assetsByChunkName)
    return vow.resolve(assetsByChunkName)
  })
}

function populate (files, metalsmith) {
  const assetsByChunkName = persist.retrieve('assetsByChunkName')
  dbg('assets')
  dbg(assetsByChunkName)
  Object.values(assetsByChunkName).forEach((assets) => {
    assets.forEach((asset) => {
      dbg('toMs: ', asset)
      files[asset] = fileCache.retrieve(asset)
    })
  })

  // populate meta with references and stats
  const meta = metalsmith.metadata()
  const stats = persist.retrieve('stats')

  // allow tests etc to detect whether cache was used
  stats.fromCache = fromCache

  // one chunk may have multiple assets, in meta we're just going to
  // store the path to the last asset. Probably wont work for all uses.
  const assets = {}
  Object.keys(assetsByChunkName).forEach((chunkName) => {
    assets[chunkName] = join(sep, assetsByChunkName[chunkName].slice(-1).join())
  })
  meta.webpack = { stats, assets }

  // show plugin users the standard webpack stats
  dbg(persist.retrieve('statsDisplay'))
  dbg(assets)
  return vow.resolve()
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
