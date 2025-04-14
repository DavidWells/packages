const { parse } = require('oparser')
const { getLineCount, getLineNumberFromMatch } = require('./utils')
const dedentString = require('./utils/dedent')

// https://expressive-code.com/key-features/word-wrap/

/* old patterns
// https://regex101.com/r/nIlW1U/6
const CODE_BLOCK_RE = /^([A-Za-z \t]*)```([A-Za-z]*)?([A-Za-z_ \t="'{}]*)?\n([\s\S]*?)```([A-Za-z \t]*)*$/gm
const CODE_BLOCK_FOUR_REGEX = /^([A-Za-z \t]*)````([A-Za-z]*)?([A-Za-z_ \t="'{}]*)?\n([\s\S]*?)````([A-Za-z \t]*)*$/gm
// https://regex101.com/r/ydaz8U/1
const THREE_TICK_PATTERN = /^(>(?: >)*)?([A-Za-z \t]*)```([A-Za-z]*)?([A-Za-z_ \t="'{}]*)?\n\s*(`{4,})?\s*([\s\S]*?)(`{4,})?([\s]*?)```([A-Za-z \t]*)*$/gm
const THREE_TILDE_PATTERN = /^(>(?: >)*)?([A-Za-z \t]*)~~~([A-Za-z]*)?([A-Za-z_ \t="'{}]*)?\n\s*(`{4,})?\s*([\s\S]*?)(`{4,})?([\s]*?)~~~([A-Za-z \t]*)*$/gm
const FOUR_TICK_PATTERN = /^(>(?: >)*)?([A-Za-z \t]*)````([A-Za-z]*)?([A-Za-z_ \t="'{}]*)?\n\s*(```)?\s*([\s\S]*?)(```)?([\s]*?)````([A-Za-z \t]*)*$/gm
*/

// https://regex101.com/r/oPKKoC/1
const REMOVE_CODE_BLOCK_RE = /^(?:[A-Za-z \t]*)?(```(?:[A-Za-z]*)?\n(?:[\s\S]*?)```)([A-Za-z \t]*)*$/gm
// remove inline `code` blocks
const REMOVE_INLINE_CODE_BLOCK = /`[^`\n]*`/g
// https://regex101.com/r/ydaz8U/8
const CODE_BLOCK_RE = /^(>(?: >)*)?([A-Za-z \t]*)([`~]{3,4})([A-Za-z]*)?(.*)?\n\s*([`~]{3,4})?\s*([\s\S]*?)(\6)?[\s]*?(\3)([A-Za-z \t]*)*$/gm
// https://regex101.com/r/ydaz8U/14
const CODE_BLOCK_HTML_RE = /^(>(?: >)*)?([A-Za-z \t]*)([`~]{3,4})([A-Za-z]*)?(.*)?\n\s*([`~]{3,4})?\s*([\s\S]*?)(\6)?[\s]*?(\3)([A-Za-z \t]*)*$|[^`](?:<(pre)\b([^>]*)>*(?:>\s*(<code\b([^>]*)>)?([\s\S]*?)(<\/code>\s*)?<\/pre>))/gm
// https://regex101.com/r/ZEMXNE/3
const MATCH_JS_COMMENT = /^(\/\*[\s\S]*?\*\/|^(\/\/ +[^\n]+(?:\n\/\/*[^\n]+)*)+)\n?/

function findCodeBlocks(block, opts = {}) {
  const {
    filePath,
    includePositions = true,
    dedentCode = true,
    includePreTags = true,
    trimLeadingComment = false,
  } = opts

  let matches
  let errors = []
  let blocks = []
  let ranges = []

  const PATTERN = (includePreTags) ? CODE_BLOCK_HTML_RE : CODE_BLOCK_RE

  while ((matches = PATTERN.exec(block)) !== null) {
    if (matches.index === PATTERN.lastIndex) {
      PATTERN.lastIndex++ // avoid infinite loops with zero-width matches
    }
    const [
      match,
      insideBlockQuote, // 1
      prefix = '', // 2
      openTicks, // 3
      syntax, // 4
      props, // 5
      innerTicksOpen = '', // 6
      _content, // 7
      innerTicksClose = '', // 8
      closeTicks, // 9
      postFix, // 10
      preTag, //  11
      preTagAttrs, // 12
      codeTag, // 13
      codeTagAttrs, // 14
      preCodeContent, // 15
    ] = matches

    //* // debug
    // console.log('match')
    // console.log(match)
    // console.log('preCodeContent', preCodeContent)
    // console.log('insideBlockQuote', insideBlockQuote)
    // console.log('prefix', prefix)
    // console.log('openTicks', openTicks)
    // console.log('syntax', syntax)
    // console.log('props', props)
    // console.log('innerTicksOpen', innerTicksOpen)
    // console.log('_content>>', _content)
    // console.log('innerTicksClose', innerTicksClose)
    // console.log('closeTicks', closeTicks)
    // console.log('postFix', postFix)
    // console.log('insideBlockQuote', insideBlockQuote)
    // console.log('prefix', `"${prefix}"`)
    /** */

    let codeContent = (preCodeContent) ? preCodeContent.trim() : _content
    if (insideBlockQuote) {
      // replace leading block quote > > arrows
      codeContent = _content.replace(new RegExp(`^${insideBlockQuote}`, 'gm'), '')
      if (prefix) {
        // trim leading spaces from codeContent if prefix exists
        codeContent = codeContent.replace(new RegExp(`^${prefix}`, ''), '')
      }
    }

    let finalCode = prefix + innerTicksOpen + codeContent + innerTicksClose

    const codeBlock = {}
    const lineNumber = getLineNumberFromMatch(block, matches)
    let hasError = false

    if (includePositions) {
      codeBlock.line = lineNumber
      codeBlock.index = matches.index
    }

    ranges.push({
      start: matches.index,
      end: matches.index + match.length
    })

    if (props) {
      codeBlock.propsRaw = props
      codeBlock.props = parse(props)
    }

    if (syntax) {
      codeBlock.syntax = syntax
    }

    if (insideBlockQuote) {
      codeBlock.prefix = insideBlockQuote + prefix
    }

    const openingComment = (codeContent.match(MATCH_JS_COMMENT) || [])[0]
    if (openingComment) {
      codeBlock.comment = openingComment.trim()
    }

    codeBlock.block = match

    const msg = (filePath) ? ` in ${filePath}` : ''
    /* Validate code blocks */
    if (prefix && prefix.match(/\S/)) {
      hasError = true
      errors.push({
        line: lineNumber,
        index: matches.index,
        message: `Prefix "${prefix}" not allowed on line ${lineNumber}. Fix the code block${msg}.`,
        block: match
      })
    }
    if (postFix && postFix.match(/\S/)) {
      hasError = true
      const line = lineNumber + (getLineCount(match) - 1)
      errors.push({
        line,
        index: matches.index + match.length,
        message: `Postfix "${postFix}" not allowed on line ${line}. Fix the code block${msg}.`,
        block: match
      })
    }

    if (!hasError) {
      if (dedentCode) {
        /* Trim leading empty newlines */
        finalCode = finalCode.replace(/^(?:[\t ]*(?:\r?\n|\r))+/, '')
        finalCode = dedentString(finalCode)
      }
      codeBlock.code = finalCode.replace(/\s+$/g, '')
      if (trimLeadingComment && openingComment) {
        codeBlock.code = codeBlock.code.replace(openingComment, '')
      }
      blocks.push(codeBlock)
    }
  }

  const inlineBlocks = collectSingleLineCodeBlocks(block)
  blocks = blocks
    .concat(inlineBlocks)
    .sort((a, b) => a.index - b.index)
    // Remove any blocks that are inside another block from ranges
    .filter((block, _index, self) => !ranges.some(r => r.start < block.index && r.end > block.index))

  // console.log('blocks.length', blocks.length)
  return {
    errors,
    blocks
  }
}

// https://github.com/shikijs/shiki/issues/660
// https://regex101.com/r/a7hgWC/1
const PATTERN =
  /`(js|javascript|ts|typescript|html|css|python)\s+((?:[^`\n]|(?<=\\)`)+)`|`([^`\n]+)\{:(js|javascript|ts|typescript|html|css|python)\}`/g
// {:language}

function createInlineCodeRegex(languages = ['js', 'javascript', 'ts', 'typescript', 'html', 'css', 'python']) {
  const langPattern = languages.join('|')

  return new RegExp([
    // Pattern 1: Single backtick with language prefix - `js code`
    `\`(${langPattern})\\s+((?:[^\`\\n]|(?<=\\\\)\`)+)\``,
    // Pattern 2: Single backtick with language suffix - `code`{:javascript}
    `\`([^\`\\n]+)\\{:(${langPattern})\\}\``
  ].join('|'), 'g')
}

const INLINE_CODE_PATTERN = createInlineCodeRegex()

function collectSingleLineCodeBlocks(text) {
  let match
  const results = []

  while ((match = INLINE_CODE_PATTERN.exec(text)) !== null) {
    if (match.index === INLINE_CODE_PATTERN.lastIndex) {
      INLINE_CODE_PATTERN.lastIndex++ // avoid infinite loops with zero-width matches
    }

    const lineNumber = getLineNumberFromMatch(text, match)
    // Check which pattern matched
    if (match[1] && match[2]) {
      // Pattern 1: prefix match
      results.push({
        line: lineNumber,
        index: match.index,
        syntax: match[1],
        code: match[2],
        block: match[0],
        inline: true,
      })
    } else if (match[3] && match[4]) {
      // Pattern 2: suffix match
      results.push({
        line: lineNumber,
        index: match.index,
        syntax: match[4],
        code: match[3],
        block: match[0],
        inline: true,
      })
    }
  }
  return results // .concat(findCodeBlocks(text).blocks)
}

function removeCode(text = '') {
  return text
    .replace(CODE_BLOCK_HTML_RE, '')
    .replace(REMOVE_INLINE_CODE_BLOCK, '')
}

module.exports = {
  findCodeBlocks,
  removeCode,
  CODE_BLOCK_RE,
  CODE_BLOCK_HTML_RE,
  collectSingleLineCodeBlocks,
  // REMOVE_CODE_BLOCK_RE
}
