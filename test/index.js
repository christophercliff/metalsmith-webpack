var assertDir = require('assert-dir-equal')
var Metalsmith = require('metalsmith')
var eslint = require('mocha-eslint')
var path = require('path')
var webpack = require('../dist').default
var multimatch = require('multimatch')

eslint(['test/*.js', 'lib'])

describe('metalsmith-webpack', function () {
  it('should pack basic', function (done) {
    (new Metalsmith('test/fixtures/basic'))
      .use(webpack({
        config: {
          context: path.resolve(__dirname, './fixtures/basic/src/js'),
          entry: './index.js',
          output: {
            path: path.resolve(__dirname, './fixtures/basic/build/js'),
            filename: 'bundle.js'
          }
        },
        stats: { chunks: false }
      }))
      .build(function (err, files) {
        if (err) return done(err)
        Object.keys(files).length.should.equal(4)
        assertDir('test/fixtures/basic/expected', 'test/fixtures/basic/build')
        return done(null)
      })
  })

  it('should pack complex', function (done) {
    (new Metalsmith('test/fixtures/complex'))
      .use(webpack({
        context: path.resolve(__dirname, './fixtures/complex/src/js'),
        entry: {
          a: './index-a.js',
          b: './index-b.js'
        },
        output: {
          path: path.resolve(__dirname, './fixtures/complex/build/js'),
          filename: '[name]-bundle.js'
        }
      }))
      .build(function (err) {
        if (err) return done(err)
        assertDir('test/fixtures/complex/expected', 'test/fixtures/complex/build')
        return done(null)
      })
  })
  it('should add webpack stats', function (done) {
    (new Metalsmith('test/fixtures/complex'))
    .use(webpack({
      context: path.resolve(__dirname, './fixtures/complex/src/js'),
      entry: {
        a: './index-a.js',
        b: './index-b.js'
      },
      output: {
        path: path.resolve(__dirname, './fixtures/complex/build/js'),
        filename: '[name]-bundle.js'
      }
    }))
    .build(function (err, files) {
      if (err) return done(err)
      multimatch(Object.keys(files), ['**/a-bundle.js', '**/b-bundle.js']).forEach(function (file) {
        console.log(file)
        files[file].should.be.an.instanceOf(Object).and.have.property('webpackStats')
        files[file].webpackStats.should.be.an.instanceOf(Object).and.have.property('hash')
      })
      return done(null)
    })
  })
})
