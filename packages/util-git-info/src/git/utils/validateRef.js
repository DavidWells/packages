/**
 * Validates a git ref (SHA, branch, tag, `HEAD~1`, ...) passed to git as an argument.
 * Refs are never put in a shell string, so this only blocks what git itself would
 * misread: a leading `-` (parsed as an option, e.g. `--output=<file>`) and NUL/newlines.
 * @param {string} ref - The ref to validate
 * @param {string} [label] - What the ref is, for the error message
 * @returns {string} The ref
 * @throws {Error} If the ref is empty, not a string, or could be read as an option
 */
function validateRef(ref, label = 'Git ref') {
  if (!ref || typeof ref !== 'string') {
    throw new Error(`${label} must be a non-empty string`)
  }
  if (ref.startsWith('-')) {
    throw new Error(`${label} must not start with "-": ${ref}`)
  }
  if (/[\0\n\r]/.test(ref)) {
    throw new Error(`${label} contains null bytes or newlines`)
  }
  return ref
}

module.exports = { validateRef }
