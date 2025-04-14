const { findFrontmatter } = require('./find-frontmatter')

const TRIM_LEADING_AND_TRAILING_LINE_BREAKS = /^[\t\n\r ]+$|^[\t ]*[\n\r]+|[\n\r]+[\t ]*$/g
const FIRST_H1_ATX = /^[ \t]*# (.*)/
const FIRST_H1_SETEXT = /^(.*)\n?===+/
const FIRST_H1_HTML = /^<h1\b([^>]*)>*(?:>([\s\S]*?)<\/h1>)/

function removeLeadingH1(text = '') {
  const frontmatter = text.indexOf('---') !== -1 ? findFrontmatter(text).frontMatterRaw : ''
  text = (frontmatter) ? removeSurroundingEmptyLines(text.replace(frontmatter, '')) : removeSurroundingEmptyLines(text.trim())

  let finalContent = text
  // Remove Leading h1 if exists
  if (text.startsWith('# ') || text.match(FIRST_H1_ATX)) {
    finalContent = text.replace(FIRST_H1_ATX, '')
  // Remove heading H1 if ========= setext format
  } else if (text.match(FIRST_H1_SETEXT)) {
    finalContent = text.replace(FIRST_H1_SETEXT, '')
  // Remove heading H1 if ========= <h1>format</h1>
  } else if (text.match(FIRST_H1_HTML)) {
    finalContent = text.replace(FIRST_H1_HTML, '')
  }

  if (frontmatter) {
    return frontmatter + '\n\n' + finalContent.trim()
  }

  return finalContent.trim()
}

if (require.main === module) {
  const text = `
# Hello World
This is a test
  `
  console.log(removeLeadingH1(text))
}

function removeSurroundingEmptyLines(str) {
  return str.replace(TRIM_LEADING_AND_TRAILING_LINE_BREAKS, '')
}

module.exports = {
  removeLeadingH1,
  removeSurroundingEmptyLines,
}
