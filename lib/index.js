var MemoryInputFileSystem = require('enhanced-resolve/lib/MemoryInputFileSystem')
var MemoryOutputFileSystem = require('webpack/lib/MemoryOutputFileSystem')
var tty = require('tty')
var path = require('path')
var webpack = require('webpack')

module.exports = plugin

function plugin(config) {
    var compiler = webpack(config)
    var files = {}
    var fs = new MemoryInputFileSystem(files)
    compiler.outputFileSystem = new MemoryOutputFileSystem(files)
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
            console.log(info)
            fs.readdirSync(config.output.path).forEach(function (file) {
                var filePath = path.join(config.output.path, file)
                // the internal map handles relative paths, if you give it
                // absolute paths it will not write these files to the disk
                var relFilePath = path.relative(metalsmith.source(), filePath)
                var key = getMetalsmithKey(files, relFilePath) || relFilePath
                files[key] = {
                    contents: fs.readFileSync(filePath)
                }
            })
            return done()
        })
    }
}

function useColors() {
    return tty.isatty(1 /* stdout */)
}

function getMetalsmithKey(files, p) {
    p = normalizePath(p)
    for (var key in files) {
        if (normalizePath(key) === p) return key
    }
    return null
}

function normalizePath(p) {
    return p.split(path.sep).filter(function (p) {
        return typeof p === 'string' && p.length > 0
    }).join('/')
}
