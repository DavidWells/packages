const { smartSlugger } = require('../utils/slugger')
const { findHeadings } = require('../find-headings')
const { normalizeLevels } = require('./normalize')
const { removeTocItems, matchItem } = require('./filter')

const matchTextEscaped = '.*?'
// /^#{1}\s+(.*)/
const OPENING_MD_HEADING = new RegExp(`^#{1,6}\\s*\\[?${matchTextEscaped}\\]?(?:.*)?`)
// /^<(h[1-6])[^>]*>.*?<\/\1>/
const OPENING_HTML_HEADING = /^<(h[1-6])[^>]*>.*?<\/\1>/
// new RegExp(`^<h1\\b[^>]*>[\\s]*?(${matchTextEscaped})[\\s]*?<\\/h1>`, 'gim')
// /^(.*)\n={3,}/
const OPENING_SETEXT_HEADING = new RegExp(`^(${matchTextEscaped})\n={3,}`)

const defaultTocOptions = {
  includeHtmlHeaders: true,
}

function treeBuild(contents, opts = {}) {
  const options = Object.assign({}, defaultTocOptions, opts)
  let content = (contents || '').trim()

  let openingHeading = ''
  if (opts.trimLeadingHeading) {
    const openingHeadingMD = content.match(OPENING_MD_HEADING)
    const openingHeadingHTML = content.match(OPENING_HTML_HEADING)
    const openingHeadingSetext = content.match(OPENING_SETEXT_HEADING)
    // Remove first heading
    if (openingHeadingMD) {
      content = content.replace(OPENING_MD_HEADING, '').trim()
      openingHeading = openingHeadingMD[0]
    } else if (openingHeadingHTML) {
      content = content.replace(OPENING_HTML_HEADING, '').trim()
      openingHeading = openingHeadingHTML[0]
    } else if (openingHeadingSetext) {
      content = content.replace(OPENING_SETEXT_HEADING, '').trim()
      openingHeading = openingHeadingSetext[0]
    }
  }
  /*
  console.log('openingHeading', openingHeading)
  // console.log(content)
  process.exit(1)
  /** */

  const headings = options.headings || findHeadings(content, options)
  // console.log('headings', headings)
  // process.exit(1)

  if (!headings.length) {
    return []
  }

  const firstHeading = headings[0]
  if (!firstHeading) {
    return []
  }

  const slugFn = smartSlugger()
  const navigation = []
  const base = 0 // +firstHeading.level
  // console.log('base', base)

  for (let i = 0; i < headings.length; i++) {
    const heading = headings[i]
    if (!heading.text) {
      continue
    }
    // Min level is 0
    const newLevel = +heading.level - base
    // const realNewLevel = (newLevel < 0) ? 0 : newLevel
    const location = findLocation(navigation, newLevel)
    const leaf = {
      level: newLevel,
      // index: heading.index,
      text: heading.text,
      slug: slugFn(heading.text),
      match: heading.match,
    }
    if (!options.excludeIndex) {
      leaf.index = heading.index
    }
    location.push(leaf)
  }

  const result = flattenToc((options.removeTocItems) ? removeTocItems(navigation, options.removeTocItems) : navigation)
  // console.log('result', result)
  // process.exit(1)

  if (options.subSection) {
    // Find matching subsection recursively
    const subSections = findMatchingSubSections(result, options.subSection)

    if (!subSections) {
      const msg = 'Error: No sub-section found.'
      console.log(msg)
      console.log(' via options.subSection', options.subSection)
      throw new Error(msg + ' Unable to generate ToC for sub-section')
    }

    if (subSections && subSections.length > 1) {
      const msg = 'Error: Multiple subSections found.'
      console.log(msg)
      console.log(subSections.map((s) => `- "${s.match}" at index: ${s.index}`).join('\n'))
      console.log(' via options.subSection', options.subSection)
      throw new Error(msg + ' Provide index of heading or rename conflicting headings')
    }

    return normalizeLevels([subSections[0]], 1)
  }

  if (options.normalizeLevels) {
    return normalizeLevels(result, 1)
  }

  return result
}

function findMatchingSubSections(items, matcher) {
  let matches = []

  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    if (matchItem(item, matcher)) {
      // Found matching section
      matches.push(item)
    }
    if (item.children) {
      const found = findMatchingSubSections(item.children, matcher)
      if (found && found.length) {
        matches = matches.concat(found)
      }
    }
  }

  return matches.length ? matches : null
}

function findLocation(navigation, depth) {
  if (depth <= 0) {
    return navigation
  }
  let loc = navigation[navigation.length - 1]
  if (!loc) {
    loc = { children: [] }
    navigation.push(loc)
  } else if (!loc.children) {
    loc.children = []
  }
  return findLocation(loc.children, depth - 1)
}

function flattenToc(arr) {
  const result = []

  for (let i = 0; i < arr.length; i++) {
    const item = arr[i]
    if (!item.match && item.children) {
      const processedChildren = flattenToc(item.children)
      for (let j = 0; j < processedChildren.length; j++) {
        result.push(processedChildren[j])
      }
    } else {
      if (item.children && item.children.length > 0) {
        item.children = flattenToc(item.children)
      }
      result.push(item)
    }
  }

  return result
}

module.exports = {
  treeBuild,
}
