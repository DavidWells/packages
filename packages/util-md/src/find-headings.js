const { findCodeBlocks } = require('./find-code-blocks')

// https://regex101.com/r/kTr3aa/2 Matches both Setext vs atx Header Styles
const HEADINGS = /^(#{1,6})\s+(.*)|\n\n( *\S[\S ]*)\n([=]{4,})|\n\n( *\S[\S ]*)\n([-]{4,})$/gm
// https://regex101.com/r/kTr3aa/10
const HEADING_WITH_HTML = /^(?:(#{1,6})\s+(.*))$|(?:\n\n( *\S[\S ]*)\n([=]{3,}))|(?:\n\n( *\S[\S ]*)\n([-]{3,})|(?:<(h([1-6]))\b([^>]*)>*(?:>([\s\S]*?)<\/\7>)))/gmi

const BEGINS_WITH_SETEXT = /^(?:(?:\n?( *\S[\S ]*)\n([=]{3,}))|(?:\n?( *\S[\S ]*)\n([-]{3,})))/

const defaultOptions = {
  maxDepth: 6,
  // includeHtmlHeaders: true,
}

const defaultTocOptions = {
  includeHtmlHeaders: true,
}
/**
 * Get markdown headings
 */
function findHeadings(text, userOpts = {}) {
  let matches
  let headings = []
  const options = Object.assign({}, defaultOptions, userOpts)

  /* Remove conflicting code block content */
  const code = (options.codeBlocks) ? options.codeBlocks : findCodeBlocks(text)
  // console.log('code', code)
  if (code && code.blocks && code.blocks.length) {
    for (let i = 0; i < code.blocks.length; i++) {
      const item = code.blocks[i]
      const cleanCode = item.block.replace(/[-#=<>]/g, 'X')
      text = text.replace(item.block, cleanCode)
    }
  }

  // Handle Begins with setext header case....
  const leadingSetext = text.match(BEGINS_WITH_SETEXT)
  if (leadingSetext) {
    const [ _match, setextH1Text, setextH1, setextH2Text, setextH2 ] = leadingSetext
    const level = (setextH1Text) ? 1 : 2
    const headerText = setextH1Text || setextH2Text || ''
    const firstHeading = {
      text: headerText.trim(),
      match: _match,
      level: level,
    }
    if (!options.excludeIndex) {
      firstHeading.index = 1
    }
    if (options.maxDepth >= level && shouldNotFilter(firstHeading, options.filter)) {
      headings.push(firstHeading)
    }
  }

  const PATTERN = (options.includeHtmlHeaders) ? HEADING_WITH_HTML : HEADINGS
  /* Loop over headings */
  while ((matches = PATTERN.exec(text)) !== null) {
    if (matches.index === PATTERN.lastIndex) {
      PATTERN.lastIndex++ // avoid infinite loops with zero-width matches
    }
    const [
      _match,
      level, // 1
      text, // 2
      setextH1Text, // 3
      _setextH1, // 4
      setextH2Text, // 5
      _setextH2, // 6
      htmlTag, // 7
      htmlLevel, // 8
      _htmlAttributes, // 9
      htmlText, // 10
    ] = matches


    /*
    // console.log(_match)
    console.log('level', level)
    console.log('text', text)
    console.log('setextH1Text', setextH1Text)
    console.log('setextH2Text', setextH2Text)
    console.log('htmlTag', htmlTag)
    /** */

    let finalText = text || ''
    let finalLevel
    if (!level) {
      finalText = setextH1Text || setextH2Text || htmlText
      if (setextH1Text) {
        finalLevel = 1
      } else if (setextH2Text) {
        finalLevel = 2
      } else if (htmlTag) {
        finalLevel = Number(htmlLevel)
      }
    } else {
      finalLevel = level.length
    }
    // console.log(`finalText ${finalLevel}`, finalText)
    const heading = {
      text: finalText.trim(),
      match: _match,
      level: finalLevel,
      // index: matches.index
    }
    if (!options.excludeIndex) {
      heading.index = matches.index
    }
    if (options.maxDepth >= finalLevel && shouldNotFilter(heading, options.filter)) {
      headings.push(heading)
    }
  }
  return headings
}

// /^#{1}\s+(.*)/
const OPENING_MD_HEADING = /^(#{1,6})\s*\[?.*?\]?(?:.*)?/
// /^<(h[1-6])[^>]*>.*?<\/\1>/
const OPENING_HTML_HEADING = /^<(h([1-6]))[^>]*>.*?<\/\1>/i
// new RegExp(`^<h1\\b[^>]*>[\\s]*?(${matchTextEscaped})[\\s]*?<\\/h1>`, 'gim')
// /^(.*)\n={3,}/
const OPENING_SETEXT_HEADING = /^(.*?)\n(-{3,}|={3,})/

function findLeadingHeading(text = '') {
  let leadingHeading = ''
  let type = ''
  let level = 0

  if (text.startsWith('#')) {
    const openingHeadingMD = text.match(OPENING_MD_HEADING)
    if (openingHeadingMD) {
      leadingHeading = openingHeadingMD[0]
      type = 'md'
      level = openingHeadingMD[1].length
    }
  } else if (text.startsWith('<h') || text.startsWith('<H')) {
    /* mightHaveHtmlHeading */
    const openingHeadingHTML = text.match(OPENING_HTML_HEADING)
    if (openingHeadingHTML) {
      leadingHeading = openingHeadingHTML[0]
      type = 'html'
      level = Number(openingHeadingHTML[2])
    }
  } else if (text.indexOf('\n=') !== -1 || text.indexOf('\n-') !== -1) {
    /* mightHaveSetextHeading */
    const openingHeadingSetext = text.match(OPENING_SETEXT_HEADING)
    if (openingHeadingSetext) {
      leadingHeading = openingHeadingSetext[0]
      type = 'setext'
      level = openingHeadingSetext[2].startsWith('=') ? 1 : 2
    }
  }
  return {
    match: leadingHeading,
    type,
    level,
  }
}

function removeLeadingHeading(text, level) {
  const leadingHeading = findLeadingHeading(text)
  if (!leadingHeading.match) return text
  if (typeof level === 'number' && leadingHeading.level !== level) return text
  return text.replace(leadingHeading.match, '').trim()
}

function shouldNotFilter(heading, predicate) {
  return (typeof predicate === 'function') ? predicate(heading) : true
}

module.exports = {
  findHeadings,
  findLeadingHeading,
  removeLeadingHeading,
}
