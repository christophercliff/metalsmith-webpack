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

```js
Metalsmith(__dirname)
  .use(webpack({
    context: path.resolve(__dirname, './src/js/'),
    entry: './index.js',
    output: {
      path: '/js',
      filename: 'bundle.js'
    }
  }))
  .build()
```

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
