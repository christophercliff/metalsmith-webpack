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

`options` may be:

 * a [webpack configuration][webpack configuration] object.
 * a path to your webpack configuration file
 * null / undefined, config will be read from `webpack.config.js`

## Example

Construct your webpack config exactly as you would if you were calling webpack
from the command line.

```js
Metalsmith(__dirname)
.use(webpack({
  entry: {
    site: './src/js/site.js',
  },
  output: {
    path: resolve(__dirname, 'build', 'js'),
    filename: '[name].[chunkhash].js'
  }
}))
.build()
```

This example uses an asset's hash in it's filename (fingerprinting / cache busting). The filename for this asset will be stored in metalsmith meta, so you could access it from a template with something like:

`<script src="{{webpack.assets['site']}}"></script>`

This plugin will not ignore source files, you should use [metalsmith-ignore][metalsmith-ignore] for that

See the [tests][tests] for more examples.

## Tests

```
$ npm test
```

## License

MIT License, see [LICENSE](https://github.com/christophercliff/metalsmith-webpack/blob/master/LICENSE.md) for details.

## See Also

 * [metalsmith-webpack-dev-server][metalsmith-webpack-dev-server]
 * [metalsmith-webpack-suite][metalsmith-webpack-suite]
 * [metalsmith-ignore][metalsmith-ignore]

[metalsmith]: http://www.metalsmith.io/
[tests]: https://github.com/christophercliff/metalsmith-webpack/blob/master/test/index.js
[webpack]: http://webpack.github.io/
[webpack configuration]: http://webpack.github.io/docs/configuration.html
[metalsmith-ignore]: https://github.com/segmentio/metalsmith-ignore
[metalsmith-webpack-dev-server]: https://github.com/okonet/metalsmith-webpack-dev-server
[metalsmith-webpack-suite]: https://github.com/axe312ger/metalsmith-webpack-suite
