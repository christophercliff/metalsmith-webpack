import assertDir from 'assert-dir-equal'
import Metalsmith from 'metalsmith'
import eslint from 'mocha-eslint'
import {
  resolve
} from 'path'
import webpack from '../dist'
import {
  // writeFileSync as write,
  readFileSync as read
} from 'fs'

eslint(['test/*.js', 'lib'])

describe('metalsmith-webpack', function () {
  it('should pack basic', function (done) {
    (new Metalsmith('test/fixtures/basic'))
      .use(webpack({
        config: {
          context: resolve(__dirname, './fixtures/basic/src/js'),
          entry: './index.js',
          output: {
            path: resolve(__dirname, './fixtures/basic/build/js'),
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
        context: resolve(__dirname, './fixtures/complex/src/js'),
        entry: {
          a: './index-a.js',
          b: './index-b.js'
        },
        output: {
          path: resolve(__dirname, './fixtures/complex/build/js'),
          filename: '[name]-bundle.js'
        }
      }))
      .build(function (err) {
        if (err) return done(err)
        assertDir('test/fixtures/complex/expected', 'test/fixtures/complex/build')
        return done(null)
      })
  })
  it('should create meta structure', function (done) {
    (new Metalsmith('test/fixtures/complex'))
    .use(webpack({
      context: resolve(__dirname, './fixtures/meta/src/js'),
      entry: {
        a: './index-a.js',
        b: './index-b.js'
      },
      output: {
        path: resolve(__dirname, './fixtures/meta/build/js'),
        filename: '[name]-bundle.js'
      }
    }))
    .use((files, metalsmith) => {
      const fixturePath = resolve(__dirname, './fixtures/meta/meta.json')
      // dump meta to refresh fixture
      // write(
      //   fixturePath,
      //   JSON.stringify(metalsmith.metadata().webpack.assets)
      // )
      const meta = metalsmith.metadata().webpack
      meta.should.have.property('stats')
      meta.should.have.property('assets')
      meta.assets.should.deepEqual(
        JSON.parse(read(fixturePath))
      )
    })
    .build(function (err, files) {
      if (err) throw err
      done(null)
    })
  })
})
