var MemoryInputFileSystem = require('enhanced-resolve/lib/MemoryInputFileSystem')
var MemoryOutputFileSystem = require('webpack/lib/MemoryOutputFileSystem')
var path = require('path')
var webpack = require('webpack')

module.exports = plugin

function plugin(config) {
    var compiler = webpack(config)
    var files = {}
    var fs = new MemoryInputFileSystem(files)
    compiler.outputFileSystem = new MemoryOutputFileSystem(files)
    return function (files, metalsmith, done) {
        compiler.run(function (err) {
            if (err) return done(err)
            fs.readdirSync(config.output.path).forEach(function (file) {
                var filePath = path.join(config.output.path, file)
                var key = getMetalsmithKey(files, filePath) || filePath
                files[key] = {
                    contents: fs.readFileSync(filePath)
                }
            })
            return done()
        })
    }
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
