const sortingOptions = require('./sorting-options')

/* ◘◘◘◘◘◘◘◘◘◘◘◘◘◘◘◘◘◘◘◘◘◘◘◘◘◘◘◘◘◘◘◘◘◘◘◘ *
 * ◘◘◘◘◘◘ Return postCSS plugins ◘◘◘◘◘◘ *
 * ◘◘◘◘◘◘◘◘◘◘◘◘◘◘◘◘◘◘◘◘◘◘◘◘◘◘◘◘◘◘◘◘◘◘◘◘ */
module.exports = function getPostCSSPlugins({ variables, mixins, functions, env }) {
  const isProd = env === 'production'
  return {
    /* https://github.com/postcss/postcss-import - Should be first. Import CSS files for processing. */
    'postcss-import': {
      // filter: (filepath) => {},
      // root: process.cwd(),
      path: ['node_modules']
      // plugins: [],
      // resolve: (id, baseDir, importOptions) => {},
      // resolve: (path) => path.replace('@src', 'src'),
      // load: (filename, importOptions) => {},
      // skipDuplicates: true,
      // addModulesDirectories: []
    },

    /* https://github.com/postcss/postcss-simple-vars */
    'postcss-simple-vars': {
      variables: () => variables,
      unknown: (node, name, result) => {
        const file = node.source.input.file.replace(process.cwd(), '')
        const message = `Unknown variable "${name}" used in "${node.prop}: ${node.value};"\nin CSS file ${file}`
        node.warn(result, require('kleur').red(message))
      }
    },

    // Must be before postcss-nested & (postcss-simple-vars This didnt work with vars in mixins)
    /* https://github.com/postcss/postcss-mixins - Create custom CSS or JS mixins. */
    ...(!mixins)
      ? {}
      : {
          'postcss-mixins': {
            mixins: mixins,
            // mixinsFiles: ['src/mixins/*.js', 'node_modules/xyz/*/src/mixins/*.js']
            // mixinsDir: './src/mixins',
          }
        },

    /* https://github.com/andyjansson/postcss-functions
      Use JS functions in CSS properties. Alt https://github.com/gorriecoe/postcss-functions-lite */
    'postcss-functions': {
      functions: functions
    },
    /* Inline PostCSS 8 port of postcss-color-function (legacy color() adjuster syntax) */
    '@davidwells/config-postcss/src/plugins/color-function': {},
    /* https://github.com/postcss/postcss-custom-properties */
    'postcss-custom-properties': {},
    /* https://github.com/postcss/postcss-custom-media */
    'postcss-custom-media': {},
    /* https://github.com/postcss/postcss-media-minmax */
    'postcss-media-minmax': {},
    /* https://github.com/postcss/postcss-calc */
    'postcss-calc': {},
    /* https://github.com/DavidWells/components/tree/master/packages/postcss-math-plugin fork of https://github.com/shauns/postcss-math */
    '@davidwells/postcss-math': {},
    // /* https://github.com/toomuchdesign/postcss-nested-ancestors */
    'postcss-nested-ancestors': {},
    /* @nest rule https://github.com/jonathantneal/postcss-nesting */
    'postcss-nesting': {},
    /* https://github.com/postcss/postcss-nested */
    'postcss-nested': {},
    /* https://github.com/luisrudge/postcss-flexbugs-fixes */
    'postcss-flexbugs-fixes': {},
    // /* https://github.com/maximkoretskiy/postcss-initial */
    // 'postcss-initial': {
    //   // reset only inherited rules
    //   reset: 'inherited'
    // },
    /* https://github.com/csstools/postcss-preset-env */
    'postcss-preset-env': {
      autoprefixer: {
        flexbox: 'no-2009',
      },
      stage: 3,
      features: {
        'custom-properties': false,
      },
      // 'browsers': [
      //   'IE >= 10',
      //   'last 2 Chrome versions',
      //   'last 2 Firefox versions',
      //   'last 2 Safari versions',
      //   'last 2 iOS versions'
      // ]
    },
    /* https://github.com/hudochenkov/postcss-sorting - Keeps rules and at-rules content in a sorted order */
    // These dont work for some reason. Result in Error: [object Object] is not a PostCSS plugin
    // 'postcss-sorting': sortingOptions,
    // 'postcss-reporter': {
    //   clearReportedMessages: true,
    //   throwError: isProd,
    //   sortByPosition: true
    // },
    /* Shrink all the things https://github.com/cssnano/cssnano */
    ...(!isProd)
      ? {}
      : {
          cssnano: {
            preset: 'default',
            discardComments: { removeAll: true },
            zindex: false,
          }
        },
  }
}

/*
Other interesting plugins
- https://github.com/GarthDB/postcss-inherit
- Var utils https://github.com/adobe/spectrum-css/blob/26b7f7866d151f97e6abf37cdc562fccb06ab938/tools/component-builder/css/lib/varUtils.js
// https://www.npmjs.com/package/postcss-dropunusedvars
// https://www.npmjs.com/package/postcss-dropdupedvars
*/

/*
Good ref https://github.com/bundlesorg/core/blob/2154df4dbc3d34739b5122a2c8a9dd232b76ee1c/test/fixtures/expected/browser/.postcssrc.js#L106
*/
