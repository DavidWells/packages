/* eslint-disable no-var */
const path = require('path')
const packageInfo = require('./package.json')
const webpack = require('webpack')
const tagList = require('./src/tagList')

var aliases = {}
aliases['../utils/createFunctionalComponent'] = path.resolve(__dirname) + '/src/utils/createFunctionalComponent.js'
aliases['../utils/createClassComponent'] = path.resolve(__dirname) + '/src/utils/createClassComponent.js'

var entryPoints = {}
function capitalize (string) {
  return string.charAt(0).toUpperCase() + string.slice(1)
}

/* Assign aliases, define externs, define entrypoints */
for (var i = 0; i < tagList.length; i++) {
  var primative = tagList[i]
  /* define entryPoints  */
  // entryPoints[primative] = ['./src/primitives/' + primative]
  entryPoints[capitalize(primative)] = ['./src/primitives/' + primative + '/' + primative + '.class.js']
}

const externals = [
  '../utils/createFunctionalComponent',
  '../utils/createClassComponent'
].concat(Object.keys(packageInfo.peerDependencies))

module.exports = {
  target: 'web',
  entry: entryPoints,
  output: {
    path: path.resolve('dist'),
    filename: '[name]/[name].js',
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
