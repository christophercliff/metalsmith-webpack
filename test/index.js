import assertDir from 'assert-dir-equal'
import Metalsmith from 'metalsmith'
import eslint from 'mocha-eslint'
import {
  resolve
} from 'path'
import {
  default as webpack
} from '../lib'
import {
  // writeFileSync as write,
  readFileSync as read,
  unlinkSync as unlink
} from 'fs'
import assert from 'assert'
import debug from 'debug'

eslint(['test/*.js', 'lib'])

const dbg = debug('metalsmith-webpack')

describe('metalsmith-webpack', function () {
  // clean up
  after((done) => {
    unlink('cache/webpack-files.db')
    unlink('cache/webpack-mod-times-values.db')
    unlink('cache/webpack-values.db')
    done()
  })

  it('should pack (basic config)', function (done) {
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
      .use((files) => {
        // dbg(files)
      })
      .build(function (err, files) {
        if (err) return done(err)
        dbg(Object.keys(files))
        assert.equal(Object.keys(files).length, 4)
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
    (new Metalsmith('test/fixtures/meta'))
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
      assert.ok(meta.stats)
      assert.ok(meta.assets)
      assert.deepEqual(meta.assets, JSON.parse(read(fixturePath)))
    })
    .build(function (err, files) {
      if (err) throw err
      done(null)
    })
  })

  it('should skip build with cache', (done) => {
    // make cache
    new Metalsmith('test/fixtures/createCache')
    .use(webpack(
      {
        context: resolve(__dirname, './fixtures/meta/src/js'),
        entry: {
          a: './index-a.js',
          b: './index-b.js'
        },
        output: {
          path: resolve(__dirname, './fixtures/meta/build/js'),
          filename: '[name]-bundle.js'
        }
      },
      '**/*.js'
    ))
    .build((err) => {
      if (err) return done(err)

      // use cache
      new Metalsmith('test/fixtures/createCache')
      .use(webpack(
        {
          context: resolve(__dirname, './fixtures/meta/src/js'),
          entry: {
            a: './index-a.js',
            b: './index-b.js'
          },
          output: {
            path: resolve(__dirname, './fixtures/meta/build/js'),
            filename: '[name]-bundle.js'
          }
        },
        '**/*.js'
      ))
      .use((files, metalsmith) => {
        const meta = metalsmith.metadata().webpack
        assert.ok(meta.stats.fromCache)
      })
      .build(function (err, files) {
        if (err) throw err
        done(null)
      })
    })
  })
})
