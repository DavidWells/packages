// PostCSS 8 port of postcss-color-function (abandoned, postcss 6).
// Transforms the legacy color() adjuster syntax, e.g. color(#0685c4 lightness(40%)),
// into a computed rgb()/hex value via the css-color-function library.
const parser = require('postcss-value-parser')
const colorFn = require('css-color-function')

function transformColor(string) {
  return parser(string).walk((node) => {
    if (node.type !== 'function' || node.value !== 'color') {
      return
    }
    node.value = colorFn.convert(parser.stringify(node))
    node.type = 'word'
  }).toString()
}

module.exports = (opts = {}) => {
  const preserveCustomProps = opts.preserveCustomProps !== false
  return {
    postcssPlugin: 'postcss-color-function',
    Declaration(decl) {
      if (!decl.value || decl.value.indexOf('color(') === -1) {
        return
      }
      // Can't resolve color() that references a var() at build time
      if (decl.value.indexOf('var(') !== -1) {
        if (!preserveCustomProps) {
          decl.remove()
        }
        return
      }
      try {
        decl.value = transformColor(decl.value)
      } catch (error) {
        // Leave the value untouched if it can't be parsed/converted
        console.warn('postcss-color-function: could not convert', decl.value, error.message)
      }
    },
  }
}
module.exports.postcss = true
