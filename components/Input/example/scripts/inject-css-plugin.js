// Fork of https://github.com/jharris4/html-webpack-tags-plugin/blob/master/index.js

const isDefined = (v) => v !== undefined

function HtmlWebpackTestPlugin (options) {
  const htmlPluginName = isDefined(options.htmlPluginName) ? options.htmlPluginName : 'html-webpack-plugin';

  this.options = {
    htmlPluginName
  };
}

HtmlWebpackTestPlugin.prototype.apply = function (compiler) {
  const { options } = this;
  const { shouldSkip, htmlPluginName } = options;
  const { scriptsPrepend, scriptsAppend, linksPrepend, linksAppend, metas } = options;

  // Hook into the html-webpack-plugin processing
  const onCompilation = compilation => {
    const onBeforeHtmlGeneration = (htmlPluginData, callback) => {
      if (shouldSkip(htmlPluginData)) {
        if (callback) {
          return callback(null, htmlPluginData);
        } else {
          return Promise.resolve(htmlPluginData);
        }
      }

      const { assets } = htmlPluginData;
      const pluginPublicPath = assets.publicPath;
      const compilationHash = compilation.hash;
      const assetPromises = [];

      const addAsset = assetPath => {
        try {
          return htmlPluginData.plugin.addFileToAssets(assetPath, compilation);
        } catch (err) {
          return Promise.reject(err);
        }
      };

      const getPath = tag => {
        if (isString(tag.sourcePath)) {
          assetPromises.push(addAsset(tag.sourcePath));
        }
        return getTagPath(tag, options, pluginPublicPath, compilationHash);
      };

      const cssPrependPaths = linksPrepend.map(getPath);
      const cssAppendPaths = linksAppend.map(getPath);

      assets.css = cssPrependPaths.concat(assets.css).concat(cssAppendPaths);

      if (metas) {
        const getMeta = tag => {
          if (isString(tag.sourcePath)) {
            assetPromises.push(addAsset(tag.sourcePath));
          }
          if (isDefined(tag.path)) {
            return {
              content: getTagPath(tag, options, pluginPublicPath, compilationHash),
              ...tag.attributes
            };
          } else {
            return tag.attributes;
          }
        };

        const oldOptionsMeta = htmlPluginData.plugin.options.meta || {};

        htmlPluginData.plugin.options.meta = {
          ...oldOptionsMeta,
          ...metas.map(getMeta)
        };
      }

      Promise.all(assetPromises).then(() => {
        if (callback) {
          callback(null, htmlPluginData);
        } else {
          return Promise.resolve(htmlPluginData);
        }
      }, (err) => {
        if (callback) {
          callback(err);
        } else {
          return Promise.reject(err);
        }
      });
    };

    const onAlterAssetTag = (htmlPluginData, callback) => {
      if (shouldSkip(htmlPluginData)) {
        if (callback) {
          return callback(null, htmlPluginData);
        } else {
          return Promise.resolve(htmlPluginData);
        }
      }

      const pluginHead = htmlPluginData.head ? htmlPluginData.head : htmlPluginData.headTags;
      const pluginBody = htmlPluginData.body ? htmlPluginData.body : htmlPluginData.bodyTags;

      const pluginLinks = pluginHead.filter(({ tagName }) => tagName === 'link');
      const pluginScripts = pluginBody.filter(({ tagName }) => tagName === 'script');

      const headPrepend = pluginLinks.slice(0, linksPrepend.length);
      const headAppend = pluginLinks.slice(pluginLinks.length - linksAppend.length);

      const bodyPrepend = pluginScripts.slice(0, scriptsPrepend.length);
      const bodyAppend = pluginScripts.slice(pluginScripts.length - scriptsAppend.length);

      const copyAttributes = (tags, tagObjects) => {
        tags.forEach((tag, i) => {
          const { attributes } = tagObjects[i];
          if (attributes) {
            const { attributes: tagAttributes } = tag;
            Object.keys(attributes).forEach(attribute => {
              tagAttributes[attribute] = attributes[attribute];
            });
          }
        });
      };

      copyAttributes(headPrepend.concat(headAppend), linksPrepend.concat(linksAppend));
      copyAttributes(bodyPrepend.concat(bodyAppend), scriptsPrepend.concat(scriptsAppend));

      if (callback) {
        callback(null, htmlPluginData);
      } else {
        return Promise.resolve(htmlPluginData);
      }
    };

    // Webpack >= 4
    if (compilation.hooks) {
      // HtmlWebPackPlugin - new
      if (compilation.hooks.htmlWebpackPluginBeforeHtmlGeneration) {
        compilation.hooks.htmlWebpackPluginBeforeHtmlGeneration.tapAsync('htmlWebpackTagsPlugin', onBeforeHtmlGeneration);
        compilation.hooks.htmlWebpackPluginAlterAssetTags.tapAsync('htmlWebpackTagsPlugin', onAlterAssetTag);
      } else {
        const HtmlWebpackPlugin = require(htmlPluginName);
        if (HtmlWebpackPlugin.getHooks) {
          const hooks = HtmlWebpackPlugin.getHooks(compilation);
          const htmlPlugins = compilation.options.plugins.filter(plugin => plugin instanceof HtmlWebpackPlugin);
          if (htmlPlugins.length === 0) {
            const message = "Error running html-webpack-tags-plugin, are you sure you have html-webpack-plugin before it in your webpack config's plugins?";
            throw new Error(message);
          }
          hooks.beforeAssetTagGeneration.tapAsync('htmlWebpackTagsPlugin', onBeforeHtmlGeneration);
          hooks.alterAssetTagGroups.tapAsync('htmlWebpackTagsPlugin', onAlterAssetTag);
        } else {
          const message = "Error running html-webpack-tags-plugin, are you sure you have html-webpack-plugin before it in your webpack config's plugins?";
          throw new Error(message);
        }
      }
    } else {
      // Webpack < 4
      compilation.plugin('html-webpack-plugin-before-html-generation', onBeforeHtmlGeneration);
      compilation.plugin('html-webpack-plugin-alter-asset-tags', onAlterAssetTag);
    }
  };

  // Webpack 4+
  if (compiler.hooks) {
    compiler.hooks.compilation.tap('htmlWebpackTagsPlugin', onCompilation);
  } else {
    // Webpack 3
    compiler.plugin('compilation', onCompilation);
  }
}

module.exports = HtmlWebpackTestPlugin
