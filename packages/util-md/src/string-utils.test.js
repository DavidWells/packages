const { test } = require('uvu')
const assert = require('uvu/assert')
const { removeSurroundingEmptyLines, removeLeadingH1 } = require('./string-utils')

test('removeSurroundingEmptyLines - removes leading and trailing empty lines', () => {
  const input = `

Content here

  `
  const expected = 'Content here'
  const result = removeSurroundingEmptyLines(input)
  assert.equal(result, expected)
})

test('removeSurroundingEmptyLines - removes leading and trailing lines with spaces', () => {
  const input = `

  Content here

  `
  const expected = '  Content here'
  const result = removeSurroundingEmptyLines(input)
  assert.equal(result, expected)
})

test('removeSurroundingEmptyLines - removes leading and trailing lines with tabs', () => {
  const input = `

\tContent here

\t`
  const expected = '\tContent here'
  const result = removeSurroundingEmptyLines(input)
  assert.equal(result, expected)
})

test('removeSurroundingEmptyLines - removes leading and trailing lines with mixed whitespace', () => {
  const input = `

\t  Content here

  \t`
  const expected = '\t  Content here'
  const result = removeSurroundingEmptyLines(input)
  assert.equal(result, expected)
})

test('removeSurroundingEmptyLines - handles empty string', () => {
  const input = ''
  const expected = ''
  const result = removeSurroundingEmptyLines(input)
  assert.equal(result, expected)
})

test('removeSurroundingEmptyLines - handles string with only whitespace', () => {
  const input = '  \t  \n  \t  '
  const expected = ''
  const result = removeSurroundingEmptyLines(input)
  assert.equal(result, expected)
})

test('removeLeadingH1 - removes ATX style H1 heading', () => {
  const input = `# Hello World
This is a test`
  const expected = 'This is a test'
  const result = removeLeadingH1(input)
  assert.equal(result, expected)
})

test('removeLeadingH1 - removes Setext style H1 heading', () => {
  const input = `Hello World
=========
This is a test`
  const expected = 'This is a test'
  const result = removeLeadingH1(input)
  assert.equal(result, expected)
})

test('removeLeadingH1 - removes HTML style H1 heading', () => {
  const input = `<h1>Hello World</h1>
This is a test`
  const expected = 'This is a test'
  const result = removeLeadingH1(input)
  assert.equal(result, expected)
})

test('removeLeadingH1 - handles text without H1 heading', () => {
  const input = `This is a test
with no heading`
  const expected = 'This is a test\nwith no heading'
  const result = removeLeadingH1(input)
  assert.equal(result, expected)
})

test('removeLeadingH1 - handles empty string', () => {
  const input = ''
  const expected = ''
  const result = removeLeadingH1(input)
  assert.equal(result, expected)
})

test('removeLeadingH1 - handles text with only whitespace', () => {
  const input = '  \t  \n  \t  '
  const expected = ''
  const result = removeLeadingH1(input)
  assert.equal(result, expected)
})

test('removeLeadingH1 - handles text with frontmatter', () => {
  const input = `---
title: Test
---

# Hello World
This is a test`
  const expected = `---
title: Test
---

This is a test`
  const result = removeLeadingH1(input)
  assert.equal(result, expected)
})

test.run()
