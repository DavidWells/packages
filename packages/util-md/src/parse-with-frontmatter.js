const { parseFrontmatter } = require('./frontmatter')

function parseMarkdownWithFrontmatter(text = '', opts = {}) {
  const { filePath, includeRawFrontmatter = true } = opts
  const result = {}
  const errors = []
  let parsed = {
    data: {},
    content: text,
    frontMatterRaw: '',
  }

  try {
    parsed = parseFrontmatter(text)
  } catch (err) {
    errors.push(err.message)
  }

  if (filePath) {
    result.filePath = filePath
  }

  result.data = parsed.data || {}
  result.content = parsed.content || text || ''

  if (includeRawFrontmatter) {
    result.frontMatterRaw = parsed.frontMatterRaw || ''
  }

  if (typeof parsed.isHidden === 'boolean') {
    result.isHidden = parsed.isHidden
  }

  result.errors = errors

  return result
}

module.exports = {
  parseMarkdownWithFrontmatter,
}
