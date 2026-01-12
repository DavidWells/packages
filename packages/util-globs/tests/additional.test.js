const fs = require('fs')
const path = require('path')
const { test } = require('uvu')
const assert = require('uvu/assert')
const { find, getFilePaths, convertToRelative } = require('../src')
const { getGitignoreContents } = require('../src/utils/get-gitignore')

const ROOT_DIR = path.resolve(__dirname, '../')

test('getGitignoreContents - handles missing file', async () => {
  const result = await getGitignoreContents('/nonexistent/.gitignore')
  assert.equal(result, [])
})

test('getGitignoreContents - handles empty file', async () => {
  const tempFile = path.join(ROOT_DIR, '.test-gitignore-empty')
  fs.writeFileSync(tempFile, '')
  const result = await getGitignoreContents(tempFile)
  assert.equal(result, [])
  fs.unlinkSync(tempFile)
})

test('getGitignoreContents - ignores comments', async () => {
  const tempFile = path.join(ROOT_DIR, '.test-gitignore-comments')
  fs.writeFileSync(tempFile, '# Comment\nnode_modules\n# Another\n*.log\n')
  const result = await getGitignoreContents(tempFile)
  assert.ok(!result.some(line => line.startsWith('#')))
  assert.ok(result.includes('node_modules'))
  assert.ok(result.includes('*.log'))
  fs.unlinkSync(tempFile)
})

test('find - handles both string and array patterns', async () => {
  const filesString = await find('*.md', {
    cwd: ROOT_DIR,
    relativePaths: true,
  })
  const filesArray = await find(['*.md'], {
    cwd: ROOT_DIR,
    relativePaths: true,
  })
  assert.equal(filesString.sort(), filesArray.sort())
})

test('getFilePaths - handles empty patterns', async () => {
  const files = await getFilePaths(ROOT_DIR, {
    patterns: [],
  })
  assert.equal(files.length, 0)
})

test('getFilePaths - handles non-existent directory', async () => {
  try {
    await getFilePaths('/nonexistent/path', {
      patterns: ['*.js'],
    })
    assert.ok(true)
  } catch (error) {
    assert.ok(error instanceof Error)
  }
})

test('getFilePaths - absolute vs relative paths', async () => {
  const absoluteFiles = await getFilePaths(ROOT_DIR, {
    patterns: ['*.md'],
    relativePaths: false,
  })
  const relativeFiles = await getFilePaths(ROOT_DIR, {
    patterns: ['*.md'],
    relativePaths: true,
  })
  assert.ok(absoluteFiles.every(f => path.isAbsolute(f)))
  assert.ok(relativeFiles.every(f => !path.isAbsolute(f)))
  assert.equal(absoluteFiles.length, relativeFiles.length)
})

test('getFilePaths - negated patterns', async () => {
  const files = await find(['**/*.js', '!**/*.test.js', '!**/fixtures/**'], {
    ignore: ['node_modules'],
    cwd: ROOT_DIR,
    relativePaths: true,
  })
  assert.ok(!files.some(f => f.endsWith('.test.js')))
  assert.ok(files.some(f => f.endsWith('.js')))
})

test('getFilePaths - concurrent calls', async () => {
  const promises = [
    getFilePaths(ROOT_DIR, { patterns: ['*.md'], relativePaths: true }),
    getFilePaths(ROOT_DIR, { patterns: ['*.js'], relativePaths: true, ignore: ['node_modules', 'tests'] }),
    getFilePaths(ROOT_DIR, { patterns: ['*.json'], relativePaths: true }),
  ]
  const results = await Promise.all(promises)
  assert.ok(results.every(r => Array.isArray(r)))
  assert.ok(results[0].length > 0)
})

test.run()
