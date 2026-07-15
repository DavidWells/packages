const { treeBuild } = require('./toc/tree-build')

function parseMarkdownWithToc(text = '', opts = {}) {
  const { filePath, ...tocOptions } = opts
  const content = text || ''
  const result = {}
  const errors = []

  if (filePath) {
    result.filePath = filePath
  }

  result.content = content

  try {
    result.toc = treeBuild(content, tocOptions)
  } catch (err) {
    result.toc = []
    errors.push(err.message)
  }

  result.errors = errors

  return result
}

module.exports = {
  parseMarkdownWithToc,
}
