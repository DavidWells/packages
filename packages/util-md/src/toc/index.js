const { treeBuild } = require('./tree-build')
const { treeStringify } = require('./tree-stringify')
const { normalizeLevels } = require('./normalize')

/**
 * @typedef  {object}  TocOptions
 * @property {boolean} [collapse = false] - Collapse toc in <details> pane
 * @property {string}  [collapseText] - Text in expand pane
 * @property {string}  [excludeText] - Text to exclude from toc
 * @property {boolean} [stripFirstH1 = true] - Exclude first heading from toc
 * @property {boolean} [sub = false] - Mark as sub section table of contents
 * @property {number}  [maxDepth = 4] - Max depth of headings to add to toc.
 */

/**
 * @typedef {Object} TocItem
 * @property {number} level - The level of the ToC item
 * @property {string} text - The text content of the ToC item
 * @property {string} [slug] - Optional slug for the ToC item
 * @property {string} [match] - Optional match string for the ToC item
 * @property {number} [index] - Optional index position of the ToC item
 * @property {Array<TocItem>} [children] - Optional children of the ToC item
 */

/**
 * @typedef {Object} TocResult
 * @property {Array<TocItem>} tocItems - The table of contents items.
 * @property {string} text - The markdown list items text.
 * @property {Array<TocItem>} tree - The table of contents tree.
 */

/**
 * Generate a table of contents from a markdown string.
 * @param {string} contents - The markdown string to generate a table of contents from.
 * @param {TocOptions} [opts] - The options for the table of contents.
 * @returns {TocResult} - An object containing the table of contents tree and the markdown text.
 */
function generateToc(contents, opts = {}) {
  const tree = treeBuild(contents, opts)
  const result = treeStringify(tree, opts)
  result.tree = tree
  return result
}

module.exports = {
  normalizeLevels,
  treeStringify,
  treeBuild,
  generateToc,
}
