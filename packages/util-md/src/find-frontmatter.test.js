const path = require('path')
const fs = require('fs')
const { test } = require('uvu')
const assert = require('uvu/assert')
const { findFrontmatter } = require('./find-frontmatter')

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

test.run()
