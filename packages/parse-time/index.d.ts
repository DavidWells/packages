export const MONTHS: string[];
export const DAYS: string[];
/**
 * Parses a time string, number, or Date object into a JavaScript Date object
 * @param {string|number|Date} str - The time to parse. Can be a string (e.g. "tomorrow", "next monday"),
 *                                  a Unix timestamp (10 or 13 digits), or a Date object
 * @param {Object} [opts={}] - Options for parsing
 * @param {Date|number|string} [opts.now=new Date()] - Reference date to use for relative time calculations
 * @returns {Date} A JavaScript Date object representing the parsed time
 * @throws {Error} Throws an error if the input string is empty, undefined, or null
 * @example
 * // Parse relative times
 * parseTime('in 2 hours') // Returns a date 2 hours from now
 * parseTime('3 days ago') // Returns a date 3 days before now
 * parseTime('next week') // Returns a date 1 week from now
 *
 * // Parse specific dates and times
 * parseTime('January 15th 2024 at 3:30pm') // Returns 2024-01-15 15:30:00
 * parseTime('Dec 25 2023 midnight') // Returns 2023-12-25 00:00:00
 * parseTime('July 4 2023 noon') // Returns 2023-07-04 12:00:00
 *
 * // Parse special keywords
 * parseTime('today at 5pm') // Returns today at 5:00 PM
 * parseTime('yesterday noon') // Returns yesterday at 12:00 PM
 * parseTime('tomorrow at midnight') // Returns tomorrow at 00:00 AM
 *
 * // Parse with reference date
 * const nowDate = new Date('2023-01-01T12:00:00Z')
 * parseTime('in 2 hours', { now: nowDate }) // Returns 2023-01-01T14:00:00.000Z
 */
export function parseTime(str: string | number | Date, opts?: {
    now?: Date | number | string;
}): Date;
