const { treeBuild } = require('./tree-build')
const { treeProcess } = require('./tree-process')
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
 * Generate a table of contents from a markdown string.
 * @param {string} contents - The markdown string to generate a table of contents from.
 * @param {TocOptions} [opts] - The options for the table of contents.
 * @returns {Object} - An object containing the table of contents tree and the markdown text.
 */
function generateToc(contents, opts = {}) {
  const tree = treeBuild(contents, opts)
  const result = treeProcess(tree, opts)
  result.tree = tree
  return result
}

module.exports = {
  normalizeLevels,
  treeProcess,
  treeBuild,
  generateToc,
}
