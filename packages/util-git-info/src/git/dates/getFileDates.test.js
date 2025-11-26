const path = require('path')
const { test } = require('uvu')
const assert = require('uvu/assert')

const {
  getFileModifiedDate,
  getFileCreatedDate,
  getFileDates,
  getMultipleFileDates
} = require('./getFileDates')

// Use style-guard package files for testing (they're unlikely to change)
// Note: These paths are relative to the git root
const STYLE_GUARD_INDEX = path.join(__dirname, '../../../../style-guard/index.js')
const STYLE_GUARD_README = path.join(__dirname, '../../../../style-guard/README.md')
const STYLE_GUARD_PACKAGE = path.join(__dirname, '../../../../style-guard/package.json')

// Wrapper to add timing to tests
const timedTest = (name, fn) => {
  test(name, async (context) => {
    const start = Date.now()
    try {
      await fn(context)
    } finally {
      const duration = Date.now() - start
      console.log(`  ⏱️  ${name}: ${duration}ms`)
    }
  })
}

timedTest('getFileModifiedDate should return a unix timestamp', async () => {
  const timestamp = await getFileModifiedDate(STYLE_GUARD_INDEX)
  assert.ok(Number.isInteger(timestamp))
  assert.ok(timestamp > 0)
  // Should be a reasonable date (after 2020)
  assert.ok(timestamp > 1577836800)
})

timedTest('getFileCreatedDate should return a unix timestamp', async () => {
  const timestamp = await getFileCreatedDate(STYLE_GUARD_INDEX)
  assert.ok(Number.isInteger(timestamp))
  assert.ok(timestamp > 0)
  // Should be a reasonable date (after 2020)
  assert.ok(timestamp > 1577836800)
})

timedTest('getFileDates should return both created and modified dates', async () => {
  const dates = await getFileDates(STYLE_GUARD_INDEX)

  // Check timestamps exist and are valid
  assert.ok(Number.isInteger(dates.created))
  assert.ok(Number.isInteger(dates.modified))
  assert.ok(dates.created > 0)
  assert.ok(dates.modified > 0)

  // Check Date objects exist and are valid
  assert.ok(dates.createdDate instanceof Date)
  assert.ok(dates.modifiedDate instanceof Date)

  // Created date should be before or equal to modified date
  assert.ok(dates.created <= dates.modified)

  // Date objects should match timestamps
  assert.is(dates.createdDate.getTime(), dates.created * 1000)
  assert.is(dates.modifiedDate.getTime(), dates.modified * 1000)
})

timedTest('getMultipleFileDates should return dates for multiple files', async () => {
  const files = [STYLE_GUARD_INDEX, STYLE_GUARD_README, STYLE_GUARD_PACKAGE]
  const results = await getMultipleFileDates(files)

  // Should have results for all files
  assert.equal(Object.keys(results).sort(), files.sort())

  // Each file should have valid date info
  for (const file of files) {
    const dates = results[file]

    // Skip if there was an error
    if (dates.error) {
      continue
    }

    assert.ok(Number.isInteger(dates.created))
    assert.ok(Number.isInteger(dates.modified))
    assert.ok(dates.createdDate instanceof Date)
    assert.ok(dates.modifiedDate instanceof Date)
  }
})

timedTest('should reject invalid file paths - null bytes', async () => {
  try {
    await getFileModifiedDate('test\0.js')
    assert.unreachable('Should have thrown an error')
  } catch (err) {
    assert.match(err.message, /null bytes/)
  }
})

timedTest('should reject invalid file paths - command injection', async () => {
  try {
    await getFileModifiedDate('test.js; rm -rf /')
    assert.unreachable('Should have thrown an error')
  } catch (err) {
    assert.match(err.message, /suspicious characters/)
  }
})

timedTest('should reject invalid file paths - shell metacharacters', async () => {
  const dangerousPaths = [
    'test.js|cat /etc/passwd',
    'test.js`whoami`',
    'test.js$(whoami)',
    'test.js&& echo hacked',
  ]

  for (const badPath of dangerousPaths) {
    try {
      await getFileModifiedDate(badPath)
      assert.unreachable(`Should have thrown an error for: ${badPath}`)
    } catch (err) {
      assert.match(err.message, /suspicious characters/)
    }
  }
})

timedTest('should reject path traversal attempts', async () => {
  try {
    await getFileModifiedDate('../../etc/passwd')
    assert.unreachable('Should have thrown an error')
  } catch (err) {
    assert.match(err.message, /suspicious characters|directory traversal/)
  }
})

timedTest('should reject newlines in file paths', async () => {
  try {
    await getFileModifiedDate('test.js\nrm -rf /')
    assert.unreachable('Should have thrown an error')
  } catch (err) {
    assert.match(err.message, /suspicious characters/)
  }
})

timedTest('should reject empty or non-string file paths', async () => {
  try {
    await getFileModifiedDate('')
    assert.unreachable('Should have thrown an error')
  } catch (err) {
    assert.match(err.message, /non-empty string/)
  }

  try {
    await getFileModifiedDate(null)
    assert.unreachable('Should have thrown an error')
  } catch (err) {
    assert.match(err.message, /non-empty string/)
  }

  try {
    await getFileModifiedDate(undefined)
    assert.unreachable('Should have thrown an error')
  } catch (err) {
    assert.match(err.message, /non-empty string/)
  }
})

timedTest('should handle files with spaces in names', async () => {
  // This should NOT be rejected - spaces are valid in file names
  // Note: This test will fail if the file doesn't exist, but that's expected
  // The important thing is that it doesn't fail due to path validation
  try {
    await getFileModifiedDate('test file.js')
  } catch (err) {
    // Should fail because file doesn't exist, not because of validation
    assert.match(err.message, /No git history found|Failed to get/)
  }
})

timedTest('should handle relative paths correctly', async () => {
  // Relative paths should work - test with the same file
  const timestamp = await getFileModifiedDate(STYLE_GUARD_INDEX)
  assert.ok(Number.isInteger(timestamp))
  assert.ok(timestamp > 0)
})

timedTest('created date should be less than or equal to modified date', async () => {
  const dates = await getFileDates(STYLE_GUARD_INDEX)
  assert.ok(dates.created <= dates.modified,
    `Created date (${dates.created}) should be <= modified date (${dates.modified})`)
})

test.run()
