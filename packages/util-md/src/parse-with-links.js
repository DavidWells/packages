const { findLinks } = require('./find-links')

function parseMarkdownWithLinks(text = '', opts = {}) {
  const { filePath, frontmatter, unique } = opts
  const content = text || ''
  const result = {}
  const linkData = findLinks(content, {
    frontmatter,
    unique,
  })

  if (filePath) {
    result.filePath = filePath
  }

  result.content = content
  result.links = linkData.links
  result.refs = linkData.refs
  result.images = linkData.images
  result.errors = []

  return result
}

module.exports = {
  parseMarkdownWithLinks,
}
