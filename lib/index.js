import {
  join,
  relative
} from 'path'
import webpack from 'webpack'
import debug from 'debug'
import MemoryFs from 'memory-fs'
import vow from 'vow'

const dbg = debug('metalsmith-webpack')

export default function plugin (options) {
  if (!options) options = 'webpack.config.js'
  if (
    typeof options === 'string' ||
    options.config === undefined
  ) options = { config: options }
  if (typeof options.config === 'string') {
    options.config = require(options.config)
  }
  if (!Array.isArray(options.config)) options.config = [options.config]

  const compiler = webpack(options.config)
  const fs = new MemoryFs()
  compiler.outputFileSystem = fs
  return function (files, metalsmith) {
    return promisify(compiler.run.bind(compiler))()
    .then((stats) => {
      if (stats.hasErrors()) throw new Error(stats)
      dbg(stats.toString(options.stats))
      options.config.forEach(function (cnf) {
        fs.readdirSync(cnf.output.path).forEach((file) => {
          file = join(cnf.output.path, file)
          const key = relative(
            metalsmith.destination(),
            file
          )
          files[key] = { contents: fs.readFileSync(file), webpackStats: stats }
        })
      })
      return vow.resolve()
    })
  }
}

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
