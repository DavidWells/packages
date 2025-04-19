/* Recursively filter out ToC section */
function removeTocItems(array, matcher) {
  return array.reduce((acc, tocItem) => {
    if (tocItem.children && tocItem.children.length) {
      tocItem.children = removeTocItems(tocItem.children, matcher)
    }
    if (tocItem.hasOwnProperty('text')) {
      const shouldFilter = matchItem(tocItem, matcher)
      // console.log('shouldFilter', shouldFilter, tocItem.text)
      if (shouldFilter) {
        // console.log('filtering', tocItem.text)
        return acc
      }
      // console.log('not filtering', tocItem.text)
    }
    acc = acc.concat(tocItem)
    return acc
  }, [])
}

/**
 * @typedef {Object} TocItem
 * @property {string} text - The text content of the ToC item
 * @property {string} [match] - Optional match string for the ToC item
 * @property {number} [index] - Optional index position of the ToC item
 * @property {string} [slug] - Optional slug for the ToC item
 * @property {number} [level] - Optional level of the ToC item
 */

/**
 * @typedef {function(TocItem): boolean} MatcherFunction
 */

/**
 * @typedef {string|MatcherFunction|RegExp|MatcherObject} ValidMatcher
 */

/**
 * @typedef {Object} MatcherObject
 * @property {ValidMatcher} match - The criteria to match against
 * @property {number} [index] - Optional index position for matching
 */

/**
 * Determines if a ToC item matches the specified matcher criteria
 * @param {TocItem} tocItem - The ToC item to check
 * @param {ValidMatcher|Array<ValidMatcher>} matcher - The criteria to match against
 * @returns {boolean} - True if the item matches the criteria, false otherwise
 */
function matchItem(tocItem, matcher) {
  if (typeof matcher === 'string') {
    return tocItem.match === matcher || tocItem.text === matcher
  } else if (typeof matcher === 'function') {
    const result = matcher(tocItem)
    // console.log('result', result, tocItem.text)
    if (typeof result === 'undefined' || result === null) {
      return false
    }
    return result
  } else if (matcher instanceof RegExp) {
    return matcher.test(tocItem.text) || matcher.test(tocItem.match)
  } else if (Array.isArray(matcher)) {
    return matcher.some((f) => {
      const check = matchItem(tocItem, f)
      //console.log(`check ${tocItem.text}`, check, f)
      return check
    })
  } else if (typeof matcher === 'object' && matcher.match) {
    const check = matchItem(tocItem, matcher.match)
    if (typeof matcher.index === 'number') {
      // Check if index within range of 10 characters
      return check && (tocItem.index >= (matcher.index - 5) && tocItem.index <= (matcher.index + 5))
    }
    return check
  }
  return false
}

module.exports = {
  removeTocItems,
  matchItem,
}
