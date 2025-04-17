const { test } = require('uvu')
const assert = require('uvu/assert')
const { matchItem, removeTocItems } = require('./filter')
const { deepLog } = require('../utils/logger')
test('matchItem - matches text exactly', () => {
  const item = { text: 'Features', match: '### Features' }
  assert.ok(matchItem(item, 'Features'))
})

test('matchItem - matches with regex', () => {
  const item = { text: 'Features List', match: '### Features List' }
  assert.ok(matchItem(item, /Features/))
  assert.ok(matchItem(item, /^Features/))
  assert.not.ok(matchItem(item, /^List/))
})

test('matchItem - matches with function', () => {
  const item = { text: 'Features List', match: '### Features List', index: 1 }
  const resultOne = matchItem(item, (i) => i.text.includes('Features'))
  // console.log('resultOne', resultOne)
  const resultTwo = matchItem(item, (i) => i.index === 1)
  // console.log('resultTwo', resultTwo)
  assert.ok(resultOne, 'includes Features')
  assert.ok(resultTwo, 'index is 1')
  assert.not.ok(matchItem(item, (i) => i.index === 2), 'index is not 2')
})

test('removeTocItems - basic filtering', () => {
  const tree = [
    {
      text: 'Root',
      children: [
        { text: 'Features', match: '## Features' },
        { text: 'Usage', match: '## Usage' }
      ]
    }
  ]

  const filtered = removeTocItems(tree, 'Features')
  // console.log('filtered', filtered)
  assert.equal(filtered.length, 1)
  assert.equal(filtered[0].text, 'Root')
})

test('removeTocItems - deep filtering', () => {
  const tree = [
    {
      text: 'Root',
      children: [
        {
          text: 'Features',
          match: '## Features',
          children: [
            { text: 'Sub Feature', match: '### Sub Feature' }
          ]
        },
        { text: 'Usage', match: '## Usage' }
      ]
    }
  ]

  const filtered = removeTocItems(tree, 'Features')
  assert.equal(filtered.length, 1)
  assert.equal(filtered[0].text, 'Root')
  assert.equal(filtered[0].children.length, 1)
})

test('removeTocItems - multiple matches', () => {
  const tree = [
    {
      text: 'Features',
      match: '## Features',
      children: [
        { text: 'Features', match: '### Features' }
      ]
    }
  ]

  const filtered = removeTocItems(tree, 'Features')
  assert.equal(filtered.length, 0)
})

test('removeTocItems - regex filtering', () => {
  const tree = [
    {
      text: 'Features List',
      children: [
        { text: 'Basic Features', match: '## Basic Features' },
        { text: 'Advanced Features', match: '## Advanced Features' },
        { text: 'Usage', match: '## Usage' }
      ]
    }
  ]

  const filtered = removeTocItems(tree, /Features$/)
  assert.equal(filtered.length, 1)
  assert.equal(filtered[0].text, 'Features List')
  assert.equal(filtered[0].children.length, 1)
  assert.equal(filtered[0].children[0].text, 'Usage')
})

test('removeTocItems - function filtering', () => {
  const tree = [
    {
      text: 'Root',
      children: [
        { text: 'Features', match: '## Features', index: 1 },
        { text: 'Usage', match: '## Usage', index: 2 }
      ]
    }
  ]

  const filtered = removeTocItems(tree, (item) => {
    if (item.index === 1) {
      return true
    }
  })
  console.log('filtered', filtered)
  assert.equal(filtered.length, 1)
  assert.equal(filtered[0].text, 'Root')
  assert.equal(filtered[0].children.length, 1)
  assert.equal(filtered[0].children[0].text, 'Usage')
})

test('removeTocItems - array of matchers', () => {
  const tree = [
    {
      level: 1,
      text: 'Heading 1 with paragraph',
      slug: 'heading-1-with-paragraph',
      match: '# Heading 1 with paragraph',
      children: [
        {
          level: 2,
          text: 'Heading 2 with paragraph 1 😃',
          slug: 'heading-2-with-paragraph-1',
          match: '## Heading 2 with paragraph 1 😃'
        },
        {
          level: 2,
          text: 'Heading 2 with paragraph 2',
          slug: 'heading-2-with-paragraph-2',
          match: '## Heading 2 with paragraph 2',
          children: [
            {
              level: 3,
              text: 'Nested Heading 3 with paragraph',
              slug: 'nested-heading-3-with-paragraph',
              match: '### Nested Heading 3 with paragraph'
            }
          ]
        }
      ]
    },
    {
      level: 1,
      text: 'HTML Heading 1',
      slug: 'html-heading-1',
      match: '<h1>HTML Heading 1</h1>',
      children: [
        {
          level: 2,
          text: 'HTML Heading 2',
          slug: 'html-heading-2',
          match: '<h2>HTML Heading 2</h2>'
        }
      ]
    },
    {
      level: 1,
      text: 'HTML Heading 1a',
      slug: 'html-heading-1a',
      match: '<h1>HTML Heading 1a</h1>',
      children: [
        {
          level: 2,
          text: 'HTML Heading 2a',
          slug: 'html-heading-2a',
          match: '<h2>HTML Heading 2a</h2>'
        }
      ]
    }
  ]

  const matchers = [
    'HTML Heading 1',                    // exact string match
    /Heading 2.*paragraph/,              // regex match
    (item) => {
      const slugMatch = item.slug === 'html-heading-2a'
      console.log('>>>> FILTER > ', slugMatch)
      return slugMatch
    }  // function match by slug
  ]

  const filtered = removeTocItems(tree, matchers)
  // console.log('filtered', filtered)

  deepLog(filtered)

  // Should only keep items that don't match any of the matchers
  assert.equal(filtered, [
    {
      level: 1,
      text: 'Heading 1 with paragraph',
      slug: 'heading-1-with-paragraph',
      match: '# Heading 1 with paragraph',
      children: []
    },
    {
      level: 1,
      text: 'HTML Heading 1a',
      slug: 'html-heading-1a',
      match: '<h1>HTML Heading 1a</h1>',
      children: []
    }
  ])
})

test.run()
