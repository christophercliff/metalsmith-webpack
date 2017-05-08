import {
  join,
  relative
} from 'path'
import webpack from 'webpack'
import debug from 'debug'
import MemoryFs from 'memory-fs'

const dbg = debug('metalsmith-webpack')

module.exports = plugin

function plugin (options) {
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
  return function (files, metalsmith, done) {
    compiler.run(function (err, stats) {
      if (err) {
        done(err)
        return
      }
      var info = stats.toString(options.stats)
      if (stats.hasErrors()) {
        done(info)
        return
      }
      dbg(info)

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

      return done()
    })
  }
}
