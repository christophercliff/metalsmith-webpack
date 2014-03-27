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
  .use(webpack(config))
  .build()
```

### `config`

See the [`webpack configuration`][webpack configuration] documentation for details.

## Tests

```
$ npm test
```

## License

MIT License, see [LICENSE](https://github.com/christophercliff/metalsmith-webpack/blob/master/LICENSE.md) for details.

[webpack]: http://webpack.github.io/
[webpack configuration]: http://webpack.github.io/docs/configuration.html
[metalsmith]: http://www.metalsmith.io/
