var assertDir = require('assert-dir-equal')
var Metalsmith = require('metalsmith')
var webpack = require('../')

describe('metalsmith-webpack', function(){

    it('should pack some js', function(done){
        Metalsmith('test/fixtures/basic')
            .use(webpack({
                context: __dirname + '/fixtures/basic/src/js',
                entry: './index.js'
            }))
            .build(function(err){
                if (err) return done(err)
                assertDir('test/fixtures/basic/expected', 'test/fixtures/basic/build')
                return done(null)
        })
    })

})
