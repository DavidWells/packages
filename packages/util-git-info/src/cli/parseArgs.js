/**
 * Simple argument parser for CLI tools
 * @param {string[]} args - Arguments to parse
 * @param {Object} options - Parse options
 * @param {string[]} [options.boolean] - Boolean flags
 * @param {string[]} [options.string] - String options
 * @param {Object} [options.alias] - Aliases for options
 * @returns {Object} Parsed arguments
 */
function parseArgs(args, options = {}) {
  const boolean = options.boolean || []
  const string = options.string || []
  const alias = options.alias || {}

  const result = {
    _: []
  }

  // Initialize boolean flags to false
  boolean.forEach(key => {
    result[key] = false
  })

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]

    // Check if it's a flag
    if (arg.startsWith('--')) {
      const key = arg.slice(2)
      const normalizedKey = key

      // Check if it's a boolean flag
      if (boolean.includes(normalizedKey)) {
        result[normalizedKey] = true
        continue
      }

      // Check if it's a string option
      if (string.includes(normalizedKey)) {
        const value = args[i + 1]
        if (value && !value.startsWith('--')) {
          result[normalizedKey] = value
          i++ // Skip next arg since we consumed it
        }
        continue
      }

      // Unknown option, treat as string
      const value = args[i + 1]
      if (value && !value.startsWith('--')) {
        result[normalizedKey] = value
        i++
      } else {
        result[normalizedKey] = true
      }
    } else if (arg.startsWith('-') && arg.length === 2) {
      // Short flag
      const shortKey = arg.slice(1)

      // Check if there's an alias
      const longKey = alias[shortKey]
      if (longKey) {
        if (boolean.includes(longKey)) {
          result[longKey] = true
          continue
        }

        if (string.includes(longKey)) {
          const value = args[i + 1]
          if (value && !value.startsWith('-')) {
            result[longKey] = value
            i++
          }
          continue
        }
      }

      // Unknown short flag, treat as boolean
      result[shortKey] = true
    } else {
      // Positional argument
      result._.push(arg)
    }
  }

  return result
}

module.exports = {
  parseArgs
}
