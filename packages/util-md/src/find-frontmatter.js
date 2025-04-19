/* Match <!-- frontmatter --> https://regex101.com/r/Q9bBxC/1 */
const HIDDEN_FRONTMATTER_REGEX = /^<!--+(?:\r\n|\r|\n)([\w\W]*?)--+>/g
// const HIDDEN_FRONTMATTER_REGEX = /^<!--.*((.|\r?\n)*?.*-->)/g

/* Match --- frontmatter --- https://regex101.com/r/d7eAw4/1 */
const FRONTMATTER_REGEX = /(^--+(?:\r\n|\r|\n)([\w\W]*?)--+)/
// const FRONTMATTER_REGEX = /^---.*((.|\r?\n)*?.*---)/gm

// Alternative regex
// const MATTER_RE = /^---(?:\r?\n|\r)(?:([\s\S]*?)(?:\r?\n|\r))?---(?:\r?\n|\r|$)/

const emptyResult = { frontMatterRaw: '', frontMatter: '', isHidden: false }

function findFrontmatter(content = '') {
  const trimmed = content.trim()
  if (trimmed === '') {
    return emptyResult
  }

  // Quick checks before regex
  const startsWithHyphen = trimmed.startsWith('---')
  const startsWithComment = trimmed.startsWith('<!--')

  // Skip regex if simple checks fail
  if (!startsWithHyphen && !startsWithComment) {
    return emptyResult
  }

  // console.log(content)
  const text = removeConflictingContent(trimmed)
  let raw = ''
  let match = ''
  let isHidden = false

  // Only run regex if the quick check passed
  if (startsWithHyphen) {
    const hasFrontMatter = text.match(FRONTMATTER_REGEX)
    if (hasFrontMatter) {
      raw = hasFrontMatter[1]
      match = raw.trim()
        .replace(/^---+/, '---')
        .replace(/--+$/, '---')
    }
  } else if (startsWithComment) {
    const hasHiddenFrontMatter = text.match(HIDDEN_FRONTMATTER_REGEX)
    if (hasHiddenFrontMatter) {
      isHidden = true
      raw = hasHiddenFrontMatter[1] || hasHiddenFrontMatter[0]
      match = raw.trim()
        .replace(/<!--+/, '---')
        .replace(/--+>/, '---')
    }
  }

  return {
    frontMatterRaw: replaceConflictingContent(raw),
    frontMatter: replaceConflictingContent(match),
    isHidden
  }
}

function removeFrontmatter(content = '') {
  if (!content) return ''
  const trimmed = content.trim()
  // Quick checks before using regex
  if (!trimmed.startsWith('---') && !trimmed.startsWith('<!--')) {
    return trimmed // No frontmatter to remove
  }
  let text = removeConflictingContent(trimmed)
  if (trimmed.startsWith('---')) {
    text = text.replace(FRONTMATTER_REGEX, '').trim()
  } else if (trimmed.startsWith('<!--')) {
    text = text.replace(HIDDEN_FRONTMATTER_REGEX, '').trim()
  }
  return replaceConflictingContent(text)
}

function removeConflictingContent(str) {
  return str
    .replace(/[\t ]{1}---/g, '__LINE_BREAK__')
    .replace(/[\t ]--+>/g, '__CLOSE_COMMENT__')
    // TODO also handle nested <!-- comments -->
}

function replaceConflictingContent(str) {
  return str
    .replace(/__LINE_BREAK__/g, ' ---')
    .replace(/__CLOSE_COMMENT__/g, ' -->')
}

module.exports = {
  HIDDEN_FRONTMATTER_REGEX,
  FRONTMATTER_REGEX,
  findFrontmatter,
  removeFrontmatter,
}
