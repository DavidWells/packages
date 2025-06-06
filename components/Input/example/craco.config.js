const path = require('path')
const HtmlWebpackTagsPlugin = require('html-webpack-tags-plugin')
const { hotLoadPostCSS, webpackLoaderOptionUtil } = require('@davidwells/config-postcss')
const PersistBuildHashWebpackPlugin = require('webpack-persist-build-hash')

// https://github.com/djaax/html-webpack-inline-style-plugin/blob/master/index.js
// https://github.com/architgarg/html-webpack-injector/blob/master/index.js

module.exports = async function({ env }) {
  const isEnvDevelopment = env === "development"
  const isEnvProduction = env === "production"

  const postcssPlugins = hotLoadPostCSS({
    /* pass in build environment */
    env: env,
    /* Path to postcss config. Must return function */
    configPath: path.resolve(__dirname, './postcss.config'),
    /* Path to design token variables. */
    variablesPath: path.resolve(__dirname, './src/_variables'),
    /* Path to CSS mixins file */
    mixinsPath: path.resolve(__dirname, './src/_mixins'),
    /* Path to CSS functions file */
    functionsPath: path.resolve(__dirname, './src/_functions'),
    /* custom variable overrides */
    variableOverrides: {
      addedVar: 'yellow'
    },
    /* custom mixin overrides */
    mixinOverrides: {
      addedMixin: { 'color': 'purple' }
    }
  })

  return {
    babel: {
      plugins: [
       'babel-plugin-style-guard',
      ],
    },
    eslint: {
     enable: false
    },
    webpack: {
      // alias: {},
      alias: {
        'util': path.resolve(__dirname, './src/util'),
      },
      // plugins: [],
      // configure: { /* Any webpack configuration options: https://webpack.js.org/configuration */ },
      configure: (webpackConfig, { env, paths }) => {
        /*
        const rule = {
          test: /\.js$/,
          use: [ { loader: path.resolve('./loader.js'), options: {} } ]
        }
        const newRules = [rule].concat(webpackConfig.module.rules)
        webpackConfig.module.rules = newRules
        */

       /*
       const { hasFoundAny, matches } = getLoaders(webpackConfig, loaderByName("postcss-loader"));


       addAfterLoader(webpackConfig, loaderByName("babel-loader"), {
         test: /\.(js)$/,
         exclude: /node_modules/,
         loader: require.resolve('./loader.js'),
       })
       */

       // process.exit(1)
       return {
          ...webpackConfig,
          plugins: webpackConfig.plugins.concat([
            // Save build hash for responsive code to grab
            new PersistBuildHashWebpackPlugin(),
            new HtmlWebpackTagsPlugin({
              tags: [{
                path: `static/css/responsive.css`,
                attributes: { id: 'responsive-css' },
                hash: (outputPath, hash) => {
                  return outputPath.replace(/\.css$/, `-${hash}.css`)
                }
              }]
            }),
          ])
          /*
          plugins: (() => webpackConfig.plugins.map(plugin => {
            /if (plugin.constructor.name === 'MiniCssExtractPlugin') {
              plugin.options = {
                ...plugin.options,
                filename: '[name].css',
                chunkFilename: '[name].chunk.css'
              }
            }
            return plugin;
          }))(),*/
        }
      }
    },
    style: {
      postcss: {
        loaderOptions: (postcssLoaderOptions, { env, paths }) => {
          /* Hot reload modules */
          // postcssLoaderOptions.map = env === 'development' ? { inline: true } : false
          postcssLoaderOptions.parser = require('postcss-comment')
          postcssLoaderOptions.plugins = postcssPlugins
          return postcssLoaderOptions;
        }
        // loaderOptions: webpackLoaderOptionUtil(postcssPlugins)
      },
    },
  }
}


// https://github.com/issnow/craco_without_eject/blob/a928f8c9a75d907533a36deea7af1e70c1aae862/craco.config%202.js#L2
