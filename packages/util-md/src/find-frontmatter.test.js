const path = require('path')
const fs = require('fs')
const { test } = require('uvu')
const assert = require('uvu/assert')
const { findFrontmatter, removeFrontmatter } = require('./find-frontmatter')

const FRONTMATTER = path.join(__dirname, '../fixtures/file-with-frontmatter.md')
const FRONTMATTER_AND_CONTENT = path.join(__dirname, '../fixtures/file-with-frontmatter-and-content.md')
const HIDDEN_FRONTMATTER = path.join(__dirname, '../fixtures/file-with-hidden-frontmatter.md')
const NO_FRONTMATTER = path.join(__dirname, '../fixtures/file-with-no-frontmatter.md')

function read(filePath) {
  return fs.readFileSync(filePath, 'utf-8')
}

test('Find standard frontmatter', async () => {
  const content = read(FRONTMATTER)
  const result = findFrontmatter(content)

  assert.is(typeof result.frontMatterRaw, 'string')
  assert.is(typeof result.frontMatter, 'string')
  assert.is(typeof result.isHidden, 'boolean')
  assert.equal(result.isHidden, false)
  assert.ok(result.frontMatterRaw.startsWith('---'))
  assert.ok(result.frontMatterRaw.endsWith('---'))
  assert.ok(result.frontMatter.startsWith('---'))
  assert.ok(result.frontMatter.endsWith('---'))
})

test('Find frontmatter with content', async () => {
  const content = read(FRONTMATTER_AND_CONTENT)
  const result = findFrontmatter(content)

  assert.is(typeof result.frontMatterRaw, 'string')
  assert.is(typeof result.frontMatter, 'string')
  assert.is(typeof result.isHidden, 'boolean')
  assert.equal(result.isHidden, false)
  assert.ok(result.frontMatterRaw.startsWith('---'))
  assert.ok(result.frontMatterRaw.endsWith('---'))
  assert.ok(result.frontMatter.startsWith('---'))
  assert.ok(result.frontMatter.endsWith('---'))
})

test('Find hidden frontmatter', async () => {
  const content = read(HIDDEN_FRONTMATTER)
  const result = findFrontmatter(content)

  assert.is(typeof result.frontMatterRaw, 'string')
  assert.is(typeof result.frontMatter, 'string')
  assert.is(typeof result.isHidden, 'boolean')
  assert.equal(result.isHidden, true)
  assert.ok(result.frontMatterRaw.startsWith('<!--'))
  assert.ok(result.frontMatterRaw.endsWith('-->'))
  assert.ok(result.frontMatter.startsWith('---'))
  assert.ok(result.frontMatter.endsWith('---'))
})

test('No frontmatter', async () => {
  const content = read(NO_FRONTMATTER)
  const result = findFrontmatter(content)

  assert.is(typeof result.frontMatterRaw, 'string')
  assert.is(typeof result.frontMatter, 'string')
  assert.is(typeof result.isHidden, 'boolean')
  assert.equal(result.frontMatterRaw, '')
  assert.equal(result.frontMatter, '')
  assert.equal(result.isHidden, false)
})

test('Empty content', async () => {
  const result = findFrontmatter('')

  assert.is(typeof result.frontMatterRaw, 'string')
  assert.is(typeof result.frontMatter, 'string')
  assert.is(typeof result.isHidden, 'boolean')
  assert.equal(result.frontMatterRaw, '')
  assert.equal(result.frontMatter, '')
  assert.equal(result.isHidden, false)
})

test('Content with conflicting markers', async () => {
  const content = `---
title: Test
---

This is a test with --- in the content.
And also with --> in the content.
`
  const result = findFrontmatter(content)

  assert.is(typeof result.frontMatterRaw, 'string')
  assert.is(typeof result.frontMatter, 'string')
  assert.is(typeof result.isHidden, 'boolean')
  assert.equal(result.isHidden, false)
  assert.ok(result.frontMatterRaw.startsWith('---'))
  assert.ok(result.frontMatterRaw.endsWith('---'))
})

test('Content with multiple frontmatter blocks', async () => {
  const content = `---
title: First Frontmatter
---

Content here

---
title: Second Frontmatter
---
`
  const result = findFrontmatter(content)

  assert.is(typeof result.frontMatterRaw, 'string')
  assert.is(typeof result.frontMatter, 'string')
  assert.is(typeof result.isHidden, 'boolean')
  assert.equal(result.isHidden, false)
  assert.ok(result.frontMatterRaw.startsWith('---'))
  assert.ok(result.frontMatterRaw.endsWith('---'))
  // Should only extract the first frontmatter block
  assert.ok(result.frontMatter.includes('First Frontmatter'))
  assert.not.ok(result.frontMatter.includes('Second Frontmatter'))
})

test('Content with nested HTML comments', async () => {
  const content = `<!--
title: Hidden Frontmatter
-->
Content here
`
  const result = findFrontmatter(content)

  assert.is(typeof result.frontMatterRaw, 'string')
  assert.is(typeof result.frontMatter, 'string')
  assert.is(typeof result.isHidden, 'boolean')
  assert.equal(result.isHidden, true)
  assert.ok(result.frontMatterRaw.startsWith('<!--'))
  assert.ok(result.frontMatterRaw.endsWith('-->'))
})

test('Content with non-standard frontmatter delimiters', async () => {
  const content = `----
title: Non-standard
----
`
  const result = findFrontmatter(content)

  assert.is(typeof result.frontMatterRaw, 'string')
  assert.is(typeof result.frontMatter, 'string')
  assert.is(typeof result.isHidden, 'boolean')
  assert.equal(result.isHidden, false)
  assert.ok(result.frontMatterRaw.startsWith('----'))
  assert.ok(result.frontMatterRaw.endsWith('----'))
  // Should normalize to standard --- delimiters
  assert.ok(result.frontMatter.startsWith('---'))
  assert.ok(result.frontMatter.endsWith('---'))
})

test('Content with whitespace in frontmatter', async () => {
  const content = `---
  title: Whitespace Test
  description: This has extra spaces
---

Content here
`
  const result = findFrontmatter(content)

  assert.is(typeof result.frontMatterRaw, 'string')
  assert.is(typeof result.frontMatter, 'string')
  assert.is(typeof result.isHidden, 'boolean')
  assert.equal(result.isHidden, false)
  assert.ok(result.frontMatterRaw.startsWith('---'))
  assert.ok(result.frontMatterRaw.endsWith('---'))
  assert.ok(result.frontMatter.includes('title: Whitespace Test'))
  assert.ok(result.frontMatter.includes('description: This has extra spaces'))
})

test('Remove standard frontmatter', async () => {
  const content = read(FRONTMATTER)
  const result = removeFrontmatter(content)

  assert.is(typeof result, 'string')
  assert.equal(result, '')
})

test('Remove frontmatter with content', async () => {
  const content = read(FRONTMATTER_AND_CONTENT)
  const result = removeFrontmatter(content)
  // console.log('result', result)
  assert.equal(result, `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.`)
  assert.ok(result.includes('Lorem ipsum dolor sit amet, consectetur adipiscing elit'))
  assert.not.ok(result.includes('title: Test'))
})

test('Remove hidden frontmatter', async () => {
  const content = read(HIDDEN_FRONTMATTER)
  const result = removeFrontmatter(content)

  assert.is(typeof result, 'string')
  assert.equal(result, 'x')
  assert.not.ok(result.includes('title: Hidden'))
})

test('No frontmatter to remove', async () => {
  const content = read(NO_FRONTMATTER)
  const result = removeFrontmatter(content)

  assert.is(typeof result, 'string')
  assert.equal(result.length > 100, true)
})

test('Empty content', async () => {
  const result = removeFrontmatter('')

  assert.is(typeof result, 'string')
  assert.equal(result, '')
})

test('Content with conflicting markers', async () => {
  const content = `---
title: Test
---

This is a test with --- in the content.
And also with --> in the content.
`
  const result = removeFrontmatter(content)
  assert.is(typeof result, 'string')
  assert.ok(result.includes('This is a test with --- in the content'))
  assert.ok(result.includes('And also with --> in the content'))
  assert.not.ok(result.includes('title: Test'))
})

test('Content with multiple frontmatter blocks', async () => {
  const content = `---
title: First Frontmatter
---

Content here

---
title: Second Frontmatter
---
`
  const result = removeFrontmatter(content)
  assert.is(typeof result, 'string')
  assert.ok(result.includes('Content here'))
  assert.not.ok(result.includes('First Frontmatter'))
  assert.ok(result.includes('Second Frontmatter'))
})

test('Content with nested HTML comments', async () => {
  const content = `<!--
title: Hidden Frontmatter
-->
Content here
`
  const result = removeFrontmatter(content)

  assert.is(typeof result, 'string')
  assert.ok(result.includes('Content here'))
  assert.not.ok(result.includes('title: Hidden Frontmatter'))
})

test('Content with non-standard frontmatter delimiters', async () => {
  const content = `----
title: Non-standard
----
`
  const result = removeFrontmatter(content)

  assert.is(typeof result, 'string')
  assert.equal(result, '')
})

test('Content with whitespace in frontmatter', async () => {
  const content = `---
  title: Whitespace Test
  description: This has extra spaces
---

Content here
`
  const result = removeFrontmatter(content)

  assert.is(typeof result, 'string')
  assert.ok(result.includes('Content here'))
  assert.not.ok(result.includes('title: Whitespace Test'))
  assert.not.ok(result.includes('description: This has extra spaces'))
})

test.run()
