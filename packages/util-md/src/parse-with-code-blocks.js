const { findCodeBlocks } = require('./find-code-blocks')

function parseMarkdownWithCodeBlocks(text = '', opts = {}) {
  const { filePath, ...codeBlockOptions } = opts
  const content = text || ''
  const result = {}
  const codeBlocks = findCodeBlocks(content, {
    filePath,
    ...codeBlockOptions,
  })

  if (filePath) {
    result.filePath = filePath
  }

  result.content = content
  result.codeBlocks = codeBlocks.blocks
  result.errors = codeBlocks.errors || []

  return result
}

module.exports = {
  parseMarkdownWithCodeBlocks,
}
