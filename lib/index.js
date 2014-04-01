var _ = require('underscore')
var MemoryInputFileSystem = require('enhanced-resolve/lib/MemoryInputFileSystem')
var MemoryOutputFileSystem = require('webpack/lib/MemoryOutputFileSystem')
var webpack = require('webpack')

module.exports = plugin

function plugin(config) {
    var compiler = webpack(_.extend(config, {
        // override the output config
        output: {
            path: '/'
        }
    }))
    var files = {}
    var fs = new MemoryInputFileSystem(files)
    compiler.outputFileSystem = new MemoryOutputFileSystem(files)
    return function (files, metalsmith, done) {
        compiler.run(function(err){
            if (err) return done(err)
            files['js/bundle.js'] = {
                contents: fs.readFileSync('/bundle.js')
            }
            return done()
        })
    }
}
