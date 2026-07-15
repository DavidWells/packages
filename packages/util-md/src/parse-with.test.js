const fs = require('fs')
const path = require('path')
const { test } = require('uvu')
const assert = require('uvu/assert')
const { parseMarkdownWithFrontmatter } = require('./parse-with-frontmatter')
const { parseMarkdownWithToc } = require('./parse-with-toc')
const { parseMarkdownWithCodeBlocks } = require('./parse-with-code-blocks')
const { parseMarkdownWithLinks } = require('./parse-with-links')

const FIXTURES_PATH = path.join(__dirname, '../fixtures')
const fileWithLinks = fs.readFileSync(path.join(FIXTURES_PATH, 'file-with-links.md'), 'utf-8')
const syntaxFixture = fs.readFileSync(path.join(FIXTURES_PATH, 'syntax.md'), 'utf-8')

test('parseMarkdownWithFrontmatter returns parsed frontmatter and content', () => {
  const result = parseMarkdownWithFrontmatter(fileWithLinks, {
    filePath: 'file-with-links.md',
  })

  assert.is(result.filePath, 'file-with-links.md')
  assert.is(typeof result.data, 'object')
  assert.is(typeof result.content, 'string')
  assert.is(typeof result.frontMatterRaw, 'string')
  assert.equal(result.errors, [])
  assert.ok(!result.ast)
  assert.ok(!result.toc)
})

test('parseMarkdownWithToc returns content and toc without frontmatter data', () => {
  const content = '# Heading 1\n\n## Heading 2'
  const result = parseMarkdownWithToc(content)

  assert.is(result.content, content)
  assert.equal(result.toc.map((item) => item.text), ['Heading 1'])
  assert.equal(result.toc[0].children.map((item) => item.text), ['Heading 2'])
  assert.equal(result.errors, [])
  assert.ok(!result.data)
  assert.ok(!result.ast)
})

test('parseMarkdownWithCodeBlocks returns content and code blocks', () => {
  const result = parseMarkdownWithCodeBlocks(syntaxFixture)

  assert.is(result.content, syntaxFixture)
  assert.ok(Array.isArray(result.codeBlocks))
  assert.ok(result.codeBlocks.length > 0)
  assert.equal(result.errors, [])
  assert.ok(!result.data)
  assert.ok(!result.ast)
})

test('parseMarkdownWithLinks returns content and links without frontmatter data', () => {
  const result = parseMarkdownWithLinks(fileWithLinks)

  assert.is(result.content, fileWithLinks)
  assert.ok(Array.isArray(result.links))
  assert.ok(Array.isArray(result.refs))
  assert.ok(Array.isArray(result.images))
  assert.ok(result.links.includes('https://www.front.com/blog/open-beta-changes'))
  assert.ok(result.images.includes('/assets/images/lol.jpg'))
  assert.equal(result.errors, [])
  assert.ok(!result.data)
  assert.ok(!result.ast)
})

test.run()
