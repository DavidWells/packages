const { parseMarkdown } = require('./parse')
const { parseFrontmatter } = require('./frontmatter')
const { generateToc } = require('./toc')
const { removeLeadingH1 } = require('./string-utils')
const dedentString = require('./utils/dedent')
const { extractSection } = require('./extract-section')

module.exports = {
  parseMarkdown,
  parseFrontmatter,
  generateToc,
  removeLeadingH1,
  dedentString,
  extractSection,
}
