/**
 * Extract a section from markdown content based on a header title
 * @param {string} content - The markdown content to extract from
 * @param {string} sectionTitle - The title of the section to extract (without ## prefix)
 * @param {Object} options - Options for extraction
 * @param {number} options.level - The heading level to match (default: 2)
 * @param {boolean} options.includeHeader - Whether to include the header in the result (default: false)
 * @param {boolean} options.caseSensitive - Whether to match case-sensitively (default: false)
 * @returns {string|undefined} The extracted section content, or undefined if not found
 */
function extractSection(content, sectionTitle, options = {}) {
  if (!content || typeof content !== 'string') {
    return undefined
  }
  
  if (!sectionTitle || typeof sectionTitle !== 'string') {
    return undefined
  }

  const {
    level = 2,
    includeHeader = false,
    caseSensitive = false
  } = options

  // Create the header pattern based on level
  const headerPrefix = '#'.repeat(level)
  const flags = caseSensitive ? 'g' : 'gi'
  
  // Escape special regex characters in the section title
  const escapedTitle = sectionTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  
  // Create regex pattern to match the section
  // Match the header and capture content until next header of same or higher level
  const higherLevelPattern = level === 1 ? '#' : `#{1,${level}}`
  
  // Try to match with a simpler approach first
  const regex = new RegExp(
    `${headerPrefix}\\s+${escapedTitle}\\s*\\n([\\s\\S]*?)(?=\\n${higherLevelPattern}\\s.+|$)`,
    flags.includes('i') ? 'i' : ''
  )

  const match = content.match(regex)
  
  if (!match) {
    return undefined
  }

  let result = match[1]?.trim()
  
  // Include the header if requested
  if (includeHeader) {
    const headerMatch = match[0].split('\n')[0]
    result = headerMatch + '\n\n' + result
  }

  return result
}

module.exports = {
  extractSection
}