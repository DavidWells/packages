const path = require('path')

/**
 * Validates and sanitizes a file path to prevent command injection
 * @param {string} filePath - The file path to validate
 * @returns {string} The validated file path
 * @throws {Error} If the file path contains suspicious characters
 */
function validateFilePath(filePath) {
  if (!filePath || typeof filePath !== 'string') {
    throw new Error('File path must be a non-empty string')
  }

  // Check for null bytes (common injection technique)
  if (filePath.includes('\0')) {
    throw new Error('File path contains null bytes')
  }

  // Check for command injection attempts
  const dangerousPatterns = [
    /[;&|`$(){}[\]<>]/,  // Shell metacharacters
    /\n|\r/,              // Newlines
    /\.\.\//,             // Path traversal attempts (relative)
    /^\.\.\\/,            // Path traversal attempts (Windows)
  ]

  for (const pattern of dangerousPatterns) {
    if (pattern.test(filePath)) {
      throw new Error(`File path contains suspicious characters: ${filePath}`)
    }
  }

  // Normalize the path to prevent traversal attacks
  const normalized = path.normalize(filePath)

  // Additional check after normalization for path traversal
  if (normalized.includes('..')) {
    throw new Error(`File path contains directory traversal: ${filePath}`)
  }

  return filePath
}

module.exports = { validateFilePath }
