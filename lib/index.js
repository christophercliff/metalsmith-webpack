import {
  join,
  relative
} from 'path'

var tty = require('tty')

var webpack = require('webpack')
var debug = require('debug')
var dbg = debug('metalsmith-webpack')
var MemoryFs = require('memory-fs')

module.exports = plugin

function plugin (configs) {
  if (!Array.isArray(configs)) {
    configs = [configs]
  }

  var compiler = webpack(configs)
  var fs = new MemoryFs()
  compiler.outputFileSystem = fs
  return function (files, metalsmith, done) {
    compiler.run(function (err, stats) {
      if (err) {
        done(err)
        return
      }
      var info = stats.toString({ chunkModules: false, colors: useColors() })
      if (stats.hasErrors()) {
        done(info)
        return
      }
      dbg(info)

      configs.forEach(function (config) {
        fs.readdirSync(config.output.path).forEach((file) => {
          file = join(config.output.path, file)
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

function useColors () {
  return tty.isatty(1 /* stdout */)
}
