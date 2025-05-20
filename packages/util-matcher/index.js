/**
 * @typedef {Object} Item
 * @property {string} text - The display text of the item
 * @property {string} match - The matching identifier of the item
 * @property {number} [index] - Optional index position of the item
 *
 * Note: An Item must have at least one of text or match properties.
 * The matchItem function will check both properties when matching.
 */

/**
 * @typedef {string|Function|RegExp|Array|Object} ValidMatcher
 */

/**
 * Determines if an item matches the specified matcher criteria
 * @param {Item|Array<Item>} itemOrItems - The item to check
 * @param {ValidMatcher|Array<ValidMatcher>} matcher - The criteria to match against
 * @returns {boolean} - True if the item matches the criteria, false otherwise
 */
function matchItem(itemOrItems, matcher) {
  // Match against an array of matchers (any match succeeds)
  if (Array.isArray(itemOrItems)) {
    return itemOrItems.some((f) => matchItem(f, matcher))
  }
  // Match against a string
  else if (typeof matcher === 'string') {
    return itemOrItems.match === matcher || itemOrItems.text === matcher
  }
  // Match using a custom function
  else if (typeof matcher === 'function') {
    const result = matcher(itemOrItems)
    if (typeof result === 'undefined' || result === null) {
      return false
    }
    return result
  }
  // Match using a regular expression
  else if (matcher instanceof RegExp) {
    return matcher.test(itemOrItems.text) || matcher.test(itemOrItems.match)
  }
  // Match against an array of matchers (any match succeeds)
  else if (Array.isArray(matcher)) {
    return matcher.some((f) => matchItem(itemOrItems, f))
  }
  // Match against an object with matcher criteria
  else if (typeof matcher === 'object' && matcher.match) {
    return matchItem(itemOrItems, matcher.match)
  }
  return false
}

/**
 * Find all matching items
 * @param {Array<Item>} items - Array of items to search
 * @param {ValidMatcher} matcher - The criteria to match against
 * @returns {Array<Item>} - Array of matching items
 */
function findMatchingItems(items, matcher) {
  return items.filter(item => matchItem(item, matcher))
}

/**
 * Find first matching item
 * @param {Array<Item>} items - Array of items to search
 * @param {ValidMatcher} matcher - The criteria to match against
 * @returns {Item|undefined} - First matching item or undefined if none found
 */
function findFirstMatch(items, matcher) {
  return items.find(item => matchItem(item, matcher))
}

/**
 * Validates that an item has at least one of text or match properties
 * @param {Item} item - The item to validate
 * @returns {boolean} - True if the item is valid
 */
function validateItem(item) {
  return typeof item.text === 'string' || typeof item.match === 'string'
}

// Export as a module
module.exports = {
  matchItem,
  findMatchingItems,
  findFirstMatch,
  validateItem
}