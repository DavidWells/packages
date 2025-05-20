export type Item = {
    /**
     * - The display text of the item
     */
    text: string;
    /**
     * - The matching identifier of the item
     */
    match: string;
    /**
     * - Optional index position of the item
     *
     * Note: An Item must have at least one of text or match properties.
     * The matchItem function will check both properties when matching.
     */
    index?: number | undefined;
};
export type ValidMatcher = string | Function | RegExp | any[] | any;
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
export function matchItem(itemOrItems: Item | Array<Item>, matcher: ValidMatcher | Array<ValidMatcher>): boolean;
/**
 * Find all matching items
 * @param {Array<Item>} items - Array of items to search
 * @param {ValidMatcher} matcher - The criteria to match against
 * @returns {Array<Item>} - Array of matching items
 */
export function findMatchingItems(items: Array<Item>, matcher: ValidMatcher): Array<Item>;
/**
 * Find first matching item
 * @param {Array<Item>} items - Array of items to search
 * @param {ValidMatcher} matcher - The criteria to match against
 * @returns {Item|undefined} - First matching item or undefined if none found
 */
export function findFirstMatch(items: Array<Item>, matcher: ValidMatcher): Item | undefined;
/**
 * Validates that an item has at least one of text or match properties
 * @param {Item} item - The item to validate
 * @returns {boolean} - True if the item is valid
 */
export function validateItem(item: Item): boolean;
