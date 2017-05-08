# metalsmith-webpack

[![Build Status](https://travis-ci.org/christophercliff/metalsmith-webpack.png?branch=master)](https://travis-ci.org/christophercliff/metalsmith-webpack)

A [webpack][webpack] plugin for [Metalsmith][metalsmith].

## Installation

```
npm install metalsmith-webpack
```

## Usage

```js
var webpack = require('metalsmith-webpack')

Metalsmith(__dirname)
  .use(webpack(options))
  .build()
```

### Options

See the [webpack configuration][webpack configuration] documentation for details.

## Example

We recommend to store your to be generated files (css, js, and so on) in a separate directory in sour `src` directory, i.e. `src/webpack`, that way you can easily generate all of them at once. We also recommend you to generate them into the `src` directory, i.e. to `src/assets/gen` that way they will end up in the right place in the webpack build, although they will not appear on the filesystem itself, as the results are only stored in memory.

```js
Metalsmith(__dirname)
  .use(webpack({
    entry: {
      index: './src/webpack/js/index.js'
    },
    output: {
      path: __dirname + '/src/static/gen',
      filename: '[name].js'
    },
  }))
  .build()
```

If you do not want the source files themselves to be included in the build itself, you can add ignore the path with the sources the webpack plugin call, i.e. with the given configuration `.ignore('webpack')`. That way your compiled files will show up, but not the sources.

See the [tests][tests] for more examples.

## Tests

```
$ npm test
```

## License

MIT License, see [LICENSE](https://github.com/christophercliff/metalsmith-webpack/blob/master/LICENSE.md) for details.

[metalsmith]: http://www.metalsmith.io/
[tests]: https://github.com/christophercliff/metalsmith-webpack/blob/master/test/index.js
[webpack]: http://webpack.github.io/
[webpack configuration]: http://webpack.github.io/docs/configuration.html
