const { smartSlugger } = require('../utils/slugger')
const { findHeadings } = require('../find-headings')
const { normalizeLevels } = require('./normalize')
const { removeTocItems, matchItem } = require('./filter')
const { removeLeadingHeading } = require('../find-headings')

const defaultTocOptions = {
  includeHtmlHeaders: true,
}

/**
 * Builds a table of contents tree from markdown content
 * @param {string} contents - The markdown content to parse
 * @param {Object} [opts={}] - Options for building the table of contents
 * @param {boolean} [opts.includeHtmlHeaders=true] - Whether to include HTML headers
 * @param {boolean} [opts.trimLeadingHeading] - Whether to trim the leading heading
 * @param {boolean} [opts.excludeIndex] - Whether to exclude index from the result
 * @param {boolean} [opts.normalizeLevels] - Whether to normalize heading levels
 * @param {string|Object} [opts.subSection] - Subsection to extract
 * @param {Array} [opts.headings] - Pre-parsed headings to use instead of finding them
 * @param {Function|Object} [opts.removeTocItems] - Function or object to filter out TOC items
 * @returns {Array<import('./index').TocItem>} Array of TOC items with the following structure:
 *   - level: number - The heading level
 *   - text: string - The heading text
 *   - slug: string - The slugified heading text
 *   - match: string - The original heading match
 *   - index: number - The index of the heading in the content (if not excluded)
 *   - children: Array<Object> - Nested headings (if any)
 */
function treeBuild(contents, opts = {}) {
  const options = Object.assign({}, defaultTocOptions, opts)
  let content = (contents || '').trim()

  if (content && opts.trimLeadingHeading) {
    content = removeLeadingHeading(content, opts.trimLeadingHeading)
  }
  /*
  if (openingHeading) {
    console.log('openingHeading', openingHeading)
    console.log('content', content)
    process.exit(1)
  }
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


  const findSubSection = options.subSection || options.section
  if (findSubSection) {
    // Find matching subsection recursively
    let subSections = findMatchingSubSections(result, findSubSection)
    if (!subSections) {
      const msg = 'Error: No sub-section found.'
      console.log(msg)
      console.log(' via options.subSection', findSubSection)
      throw new Error(msg + ' Unable to generate ToC for sub-section')
    }

    if (subSections && subSections.length > 1) {
      // Try and find the closes section based on index
      const closestSection = findClosestSection(subSections, findSubSection)

      if (!closestSection) {
        const msg = 'Error: Multiple subSections found.'
        console.log(msg)
        console.log(subSections.map((s) => `- "${s.match}" at index: ${s.index}`).join('\n'))
        console.log(' via options.subSection', options.subSection)
        throw new Error(msg + ' Provide index of heading or rename conflicting headings')
      }
      subSections = [closestSection]
    }

    const subsection = (options.section) ? [subSections[0]] : subSections[0].children || []
    return normalizeLevels(subsection, 1)
  }

  if (options.normalizeLevels) {
    return normalizeLevels(result, 1)
  }

  return result
}


function findClosestSection(subSections, targetSection) {
  let closest = subSections[0]
  let minDiff = Math.abs(subSections[0].index - targetSection.index)
  for (let i = 1; i < subSections.length; i++) {
    const diff = Math.abs(subSections[i].index - targetSection.index)
    if (diff < minDiff) {
      minDiff = diff
      closest = subSections[i]
    }
  }
  return closest
}

/**
 * Finds matching subsections in the TOC tree
 * @param {Array<import('./index').TocItem>} items - Array of TOC items
 * @param {string|Object} matcher - Matcher to find subsections
 * @returns {Array<import('./index').TocItem>|null} Array of matching subsections or null if none found
 */
function findMatchingSubSections(items, matcher) {
  let matches = []

  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    if (matcher && matchItem(item, matcher)) {
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

/**
 * Finds the location in the navigation tree to add a new item
 * @param {Array<Object>} navigation - The navigation tree
 * @param {number} depth - The depth to find
 * @returns {Array<Object>} The location to add the new item
 */
function findLocation(navigation, depth) {
  if (depth <= 0) return navigation
  let loc = navigation[navigation.length - 1]
  if (!loc) {
    loc = { children: [] }
    navigation.push(loc)
  } else if (!loc.children) {
    loc.children = []
  }
  return findLocation(loc.children, depth - 1)
}

/**
 * Flattens the TOC tree
 * @param {Array<import('./index').TocItem>} arr - The TOC tree to flatten
 * @returns {Array<import('./index').TocItem>} The flattened TOC tree
 */
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
