/* eslint-disable no-var */
var path = require('path')
var packageInfo = require('./package.json')
var webpack = require('webpack')

var aliases = {}
aliases['../utils/createFunctionalComponent'] = path.resolve(__dirname) + '/src/utils/createFunctionalComponent.js'
aliases['../utils/createClassComponent'] = path.resolve(__dirname) + '/src/utils/createClassComponent.js'

var entryPoints = {
  index: './src/primitives/index.js',
}
function capitalize (string) {
  return string.charAt(0).toUpperCase() + string.slice(1)
}
var tagList = require('./src/tagList')
console.log('PROD')
/* Assign aliases, define externs, define entrypoints */
for (var i = 0; i < tagList.length; i++) {
  var primative = tagList[i]
  /* define entryPoints  */
  // entryPoints[primative] = ['./src/primitives/' + primative]
  entryPoints[capitalize(primative)] = ['./src/primitives/' + primative + '/' + primative + '.functional.js']
}

var externals = [
  '../utils/createFunctionalComponent',
  '../utils/createClassComponent'
].concat(Object.keys(packageInfo.peerDependencies))

module.exports = {
  target: 'web',
  entry: entryPoints,
  output: {
    path: path.resolve('dist'),
    filename: '[name]/index.js',
    libraryTarget: 'commonjs2',
    library: packageInfo.name
  },
  resolve: {
    root: [
      path.resolve(__dirname)
    ],
    alias: aliases,
    extensions: ['', '.js', '.jsx']
  },
  externals: externals,
  module: {
    loaders: [
      {
        test: /\.(js|jsx)$/,
        loader: 'babel',
        exclude: /(node_modules)/,
      }
    ]
  },
  plugins: [
    new webpack.optimize.DedupePlugin(),
    new webpack.DefinePlugin({
      __DEV__: false,
    })
  ],
}
