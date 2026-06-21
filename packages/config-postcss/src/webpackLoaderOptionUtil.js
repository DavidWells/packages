module.exports = function loaderOptions(postcssPlugins) {
  return (postcssLoaderOptions, { env, paths }) => {
    /* Hot reload modules */
    postcssLoaderOptions.map = env === 'development' ? { inline: true } : false
    /* Inline-comment parser, lazily required so consumers that don't use it
       (e.g. Next.js) don't need postcss-comment installed. */
    postcssLoaderOptions.parser = require('postcss-comment')
    postcssLoaderOptions.plugins = postcssPlugins
    return postcssLoaderOptions
  }
}
