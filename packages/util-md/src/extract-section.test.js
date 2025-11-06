const path = require('path')
const fs = require('fs')
const { test } = require('uvu')
const assert = require('uvu/assert')
const { extractSection } = require('./extract-section')

const FILE_WITH_HEADERS = path.join(__dirname, '../fixtures/file-with-headings.md')

function read(filePath) {
  return fs.readFileSync(filePath, 'utf-8')
}
test('extractSection - basic functionality', () => {
  const content = `# Main Title

## Section One

This is the content of section one.
It has multiple lines.

## Section Two

This is the content of section two.

## Section Three

This is the content of section three.`

  const result = extractSection(content, 'Section Two')
  assert.equal(result, 'This is the content of section two.')
})

test('extractSection - with multiline content', () => {
  const content = `# Main Title

## Installation

First, install the package:

\`\`\`bash
npm install my-package
\`\`\`

Then import it in your code:

\`\`\`javascript
const myPackage = require('my-package')
\`\`\`

## Usage

Now you can use it like this.

## API

Here's the API documentation.`

  const result = extractSection(content, 'Installation')
  const expected = `First, install the package:

\`\`\`bash
npm install my-package
\`\`\`

Then import it in your code:

\`\`\`javascript
const myPackage = require('my-package')
\`\`\``

  assert.equal(result, expected)
})

test('extractSection - case insensitive by default', () => {
  const content = `# Main Title

## Section One

Content here.

## SECTION TWO

Content here.`

  const result = extractSection(content, 'section two')
  assert.equal(result, 'Content here.')
})

test('extractSection - case sensitive option', () => {
  const content = `# Main Title

## Section One

Content here.

## SECTION TWO

Content here.`

  const result = extractSection(content, 'section two', { caseSensitive: true })
  assert.equal(result, undefined)

  const result2 = extractSection(content, 'SECTION TWO', { caseSensitive: true })
  assert.equal(result2, 'Content here.')
})

test('extractSection - different heading levels', () => {
  const content = `# Main Title

## Level 2 Section

Content at level 2.

### Level 3 Section

Content at level 3.

#### Level 4 Section

Content at level 4.

## Another Level 2

More content.`

  // Test level 2 (default) - should include nested content until next same level
  const result2 = extractSection(content, 'Level 2 Section')
  const expected2 = `Content at level 2.

### Level 3 Section

Content at level 3.

#### Level 4 Section

Content at level 4.`
  assert.equal(result2, expected2)

  // Test level 3
  const result3 = extractSection(content, 'Level 3 Section', { level: 3 })
  const expected3 = `Content at level 3.

#### Level 4 Section

Content at level 4.`
  assert.equal(result3, expected3)

  // Test level 4
  const result4 = extractSection(content, 'Level 4 Section', { level: 4 })
  assert.equal(result4, 'Content at level 4.')
})

test('extractSection - include header option', () => {
  const content = `# Main Title

## My Section

This is the content.

## Another Section

More content.`

  const result = extractSection(content, 'My Section', { includeHeader: true })
  assert.equal(result, '## My Section\n\nThis is the content.')
})

test('extractSection - section not found', () => {
  const content = `# Main Title

## Section One

Content here.

## Section Two

Content here.`

  const result = extractSection(content, 'Nonexistent Section')
  assert.equal(result, undefined)
})

test('extractSection - special characters in section title', () => {
  const content = `# Main Title

## Section with [brackets] and (parentheses)

Content here.

## Section with * asterisk

Content here.

## Section with ? question mark

Content here.`

  const result1 = extractSection(content, 'Section with [brackets] and (parentheses)')
  assert.equal(result1, 'Content here.')

  const result2 = extractSection(content, 'Section with * asterisk')
  assert.equal(result2, 'Content here.')

  const result3 = extractSection(content, 'Section with ? question mark')
  assert.equal(result3, 'Content here.')
})

test('extractSection - all content under level 1 heading', () => {
  const content = `# Main Title

## First Section

Content here.

## Last Section

This is the last section.
It has multiple lines.
And ends the document.

# Foo

sub things in diff section`

  const result = extractSection(content, 'Main Title', { level: 1 })
  assert.equal(result,
`## First Section

Content here.

## Last Section

This is the last section.
It has multiple lines.
And ends the document.`
)
})

test('extractSection - section at end of document', () => {
  const content = `# Main Title

## First Section

Content here.

## Last Section

This is the last section.
It has multiple lines.
And ends the document.`

  const result = extractSection(content, 'Last Section')
  assert.equal(result, 'This is the last section.\nIt has multiple lines.\nAnd ends the document.')
})

test('extractSection - nested sections', () => {
  const content = `# Main Title

## Parent Section

This is parent content.

### Child Section

This is child content.

### Another Child

More child content.

## Another Parent

Different parent content.`

  // Extract parent section - should include nested content
  const result = extractSection(content, 'Parent Section')
  const expected = `This is parent content.

### Child Section

This is child content.

### Another Child

More child content.`

  assert.equal(result, expected)
})

test('extractSection - with real fixture file', () => {
  const contents = read(FILE_WITH_HEADERS)

  // Extract a section from the fixture file
  const result = extractSection(contents, 'Heading 2 with paragraph 1 😃')

  assert.equal(typeof result, 'string')
  assert.ok(result.includes('Lorem ipsum dolor sit amet'))
  assert.ok(result.includes('Vivamus vitae mi ligula, non hendrerit urna.'))
})

test('extractSection - with real fixture file including nested content', () => {
  const contents = read(FILE_WITH_HEADERS)

  // Extract a section that has nested content
  const result = extractSection(contents, 'Heading 2 with paragraph 2')

  assert.equal(typeof result, 'string')
  assert.ok(result.includes('Lorem ipsum dolor sit amet'))
  assert.ok(result.includes('### Nested Heading 3 with paragraph'))
  assert.ok(result.includes('### Nested Heading 3 with paragraph 2'))
})

test('extractSection - input validation', () => {
  // Test with empty content
  assert.equal(extractSection('', 'Section'), undefined)

  // Test with null content
  assert.equal(extractSection(null, 'Section'), undefined)

  // Test with undefined content
  assert.equal(extractSection(undefined, 'Section'), undefined)

  // Test with non-string content
  assert.equal(extractSection(123, 'Section'), undefined)

  // Test with empty section title
  assert.equal(extractSection('# Content', ''), undefined)

  // Test with null section title
  assert.equal(extractSection('# Content', null), undefined)

  // Test with undefined section title
  assert.equal(extractSection('# Content', undefined), undefined)

  // Test with non-string section title
  assert.equal(extractSection('# Content', 123), undefined)
})

test('extractSection - whitespace handling', () => {
  const content = `# Main Title

##   Section With Extra Spaces

Content here.

## Another Section

More content.`

  const result = extractSection(content, 'Section With Extra Spaces')
  assert.equal(result, 'Content here.')
})

test('extractSection - empty section', () => {
  const content = `# Main Title

## Empty Section

## Another Section

Content here.`

  const result = extractSection(content, 'Empty Section')
  assert.equal(result, '')
})


test('extractSection - handles conflicting inner content', () => {
  const content = `# Main Title

## Hello Section

Hello content.

\`\`\`markdown
# inner thing
\`\`\`

\`\`\`markdown
## inner thing 2
\`\`\`

nice.

## Another Section

Content here.`

  const result = extractSection(content, 'Hello Section')
  assert.equal(result, `Hello content.

\`\`\`markdown
# inner thing
\`\`\`

\`\`\`markdown
## inner thing 2
\`\`\`

nice.`)
})

test.run()
