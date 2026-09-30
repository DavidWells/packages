/**
 * Header-only equivalent of `require('parse-diff')(input)`.
 *
 * Returns one entry per file with the same `from`, `to`, `new` and `deleted`
 * values parse-diff (0.6.0) would produce, without building chunk/change
 * objects. It walks the same line-classification state machine, so file
 * boundaries (which depend on whether a file already has chunks) and thrown
 * errors on malformed input match parse-diff exactly. Content lines are only
 * inspected by their first character.
 */

const WHITESPACE = /\s/
const DIFF = /^diff\s/
const NEW_FILE = /^new file mode \d+$/
const DELETED_FILE = /^deleted file mode \d+$/
const INDEX = /^index\s[\da-zA-Z]+\.\.[\da-zA-Z]+(\s(\d+))?$/
const FROM_FILE = /^---\s/
const TO_FILE = /^\+\+\+\s/
const CHUNK = /^@@\s+\-(\d+),?(\d+)?\s+\+(\d+),?(\d+)?\s@@/
const EOF = '\\ No newline at end of file'

/**
 * @param {string} input - Unified diff text
 * @returns {Array<{from?: string, to?: string, new?: boolean, deleted?: boolean}>}
 */
function parseDiffFiles(input) {
  if (!input) {
    return []
  }
  if (input.match(/^\s+$/)) {
    return []
  }
  /** @type {Array<any>} */
  const files = []
  /** @type {any} */
  let file = null
  // Mirrors parse-diff's `current` chunk: null until the first @@, then whether it has changes
  let hasChunk = false
  let chunkHasChanges = false

  const start = (line) => {
    file = { chunks: 0 }
    files.push(file)
    const fileNames = parseFile(line)
    if (fileNames) {
      file.from = fileNames[0]
      file.to = fileNames[1]
    }
  }
  const restart = () => {
    if (!file || file.chunks) start()
  }

  const len = input.length
  let pos = 0
  while (pos <= len) {
    let end = input.indexOf('\n', pos)
    if (end === -1) end = len
    const c = input.charCodeAt(pos)
    // parse-diff checks /^\s+/ first: any line starting with whitespace is a context line
    if (c === 32 || (end > pos && c !== 45 && c !== 43 && c !== 64 && WHITESPACE.test(input[pos]))) {
      if (hasChunk) chunkHasChanges = true
    } else if (c === 45) { // '-'
      // Only a '---' prefix can be a header; skip slicing ordinary removed lines
      if (pos + 3 < end && input.charCodeAt(pos + 1) === 45 && input.charCodeAt(pos + 2) === 45 && FROM_FILE.test(input.slice(pos, end))) {
        const line = input.slice(pos, end)
        restart()
        file.from = parseFileFallback(line)
      } else if (hasChunk) {
        chunkHasChanges = true
      }
    } else if (c === 43) { // '+'
      if (pos + 3 < end && input.charCodeAt(pos + 1) === 43 && input.charCodeAt(pos + 2) === 43 && TO_FILE.test(input.slice(pos, end))) {
        const line = input.slice(pos, end)
        restart()
        file.to = parseFileFallback(line)
      } else if (hasChunk) {
        chunkHasChanges = true
      }
    } else if (c === 100 || c === 110 || c === 105 || c === 64 || c === 92) { // d n i @ \
      const line = input.slice(pos, end)
      if (DIFF.test(line)) {
        start(line)
      } else if (NEW_FILE.test(line)) {
        restart()
        file.new = true
        file.from = '/dev/null'
      } else if (DELETED_FILE.test(line)) {
        restart()
        file.deleted = true
        file.to = '/dev/null'
      } else if (INDEX.test(line)) {
        restart()
      } else if (CHUNK.test(line)) {
        file.chunks++ // throws on null file, like parse-diff's file.chunks.push
        hasChunk = true
        chunkHasChanges = false
      } else if (line === EOF) {
        if (!hasChunk || !chunkHasChanges) {
          // parse-diff reads the previous change's type and throws when there is none
          throw new TypeError(`Cannot read properties of ${hasChunk ? 'undefined' : 'null'} (reading '${hasChunk ? 'type' : 'changes'}')`)
        }
      }
    }
    pos = end + 1
  }
  return files
}

// Copied verbatim from parse-diff 0.6.0
function parseFile(s) {
  if (!s) {
    return
  }
  const fileNames = s.match(/a\/.*(?= b)|b\/.*$/g)
  fileNames.map(function(fileName, i) {
    return fileNames[i] = fileName.replace(/^(a|b)\//, '')
  })
  return fileNames
}

// Copied from parse-diff 0.6.0 (ltrim with '-' and '+' char classes inlined)
function parseFileFallback(s) {
  s = s.replace(/^[\-]+/, '')
  s = s.replace(/^[\+]+/, '')
  s = s.trim()
  // ignore possible time stamp
  const t = /\t.*|\d{4}-\d\d-\d\d\s\d\d:\d\d:\d\d(.\d+)?\s(\+|-)\d\d\d\d/.exec(s)
  if (t) {
    s = s.substring(0, t.index).trim()
  }
  // ignore git prefixes a/ or b/
  if (s.match(/^(a|b)\//)) {
    return s.substr(2)
  }
  return s
}

module.exports = { parseDiffFiles }
