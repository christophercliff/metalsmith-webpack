var assertDir = require('assert-dir-equal')
var Metalsmith = require('metalsmith')
var path = require('path')
var webpack = require('../')

describe('metalsmith-webpack', function () {

    it('should pack basic', function (done) {
        (new Metalsmith('test/fixtures/basic'))
            .use(webpack({
                context: path.resolve(__dirname, './fixtures/basic/src/js'),
                entry: './index.js',
                output: {
                    path: '/js',
                    filename: 'index.js'
                }
            }))
            .build(function (err, files) {
                if (err) return done(err)
                Object.keys(files).length.should.equal(3)
                assertDir('test/fixtures/basic/expected', 'test/fixtures/basic/build')
                return done(null)
            })
    })

    it('should pack complex', function (done) {
        (new Metalsmith('test/fixtures/complex'))
            .use(webpack({
                context: path.resolve(__dirname, './fixtures/basic/src/js'),
                entry: {
                    a: './index-a.js',
                    b: './index-b.js'
                },
                output: {
                    path: '/js',
                    filename: '[name]-bundle.js'
                }
            }))
            .build(function (err) {
                if (err) return done(err)
                assertDir('test/fixtures/basic/expected', 'test/fixtures/basic/build')
                return done(null)
            })
    })

})
