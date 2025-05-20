const { test } = require('uvu')
const assert = require('uvu/assert')
const { matchItem, findMatchingItems, findFirstMatch } = require('./index')

// Test data
const testItems = [
  { text: 'Apple', match: 'fruit.apple', index: 0 },
  { text: 'Banana', match: 'fruit.banana', index: 1 },
  { text: 'Carrot', match: 'vegetable.carrot', index: 2 },
  { text: 'Orange', match: 'fruit.orange', index: 3 }
]

test('array matcher', () => {
  assert.is(matchItem(testItems, /Apple/), true)
})

// Test matchItem function
test('matchItem with string matcher', () => {
  assert.is(matchItem(testItems[0], 'fruit.apple'), true)
  assert.is(matchItem(testItems[0], 'Apple'), true)
  assert.is(matchItem(testItems[0], 'fruit.banana'), false)
})

test('matchItem with array', () => {
  assert.is(matchItem(testItems, 'fruit.apple'), true)
  assert.is(matchItem(testItems, 'Apple'), true, 'should match Apple')
  assert.is(matchItem(testItems, 'fake thing'), false)
})

test('matchItem with function matcher', () => {
  const matcher = item => item.index === 0
  assert.is(matchItem(testItems[0], matcher), true)
  assert.is(matchItem(testItems[1], matcher), false)

  // Test with undefined/null return
  const invalidMatcher = item => undefined
  assert.is(matchItem(testItems[0], invalidMatcher), false)
})

test('matchItem with RegExp matcher', () => {
  const matcher = /fruit/
  assert.is(matchItem(testItems[0], matcher), true)
  assert.is(matchItem(testItems[2], matcher), false)
})

test('matchItem with array matcher', () => {
  const matchers = ['fruit.apple', 'fruit.banana']
  assert.is(matchItem(testItems[0], matchers), true)
  assert.is(matchItem(testItems[1], matchers), true)
  assert.is(matchItem(testItems[2], matchers), false)
})

test('matchItem with object matcher', () => {
  const matcher = { match: 'fruit.apple' }
  assert.is(matchItem(testItems[0], matcher), true)
  assert.is(matchItem(testItems[1], matcher), false)
})

// Test findMatchingItems function
test('findMatchingItems finds all matches', () => {
  const fruitMatcher = /fruit/
  const matches = findMatchingItems(testItems, fruitMatcher)
  assert.is(matches.length, 3)
  assert.is(matches[0].text, 'Apple')
  assert.is(matches[1].text, 'Banana')
  assert.is(matches[2].text, 'Orange')
})

// Test findFirstMatch function
test('findFirstMatch finds first match', () => {
  const bananaMatcher = 'fruit.banana'
  const match = findFirstMatch(testItems, bananaMatcher)
  assert.is(match.text, 'Banana')
  assert.is(match.index, 1)
})

test('findFirstMatch returns undefined when no match', () => {
  const noMatch = findFirstMatch(testItems, 'nonexistent')
  assert.is(noMatch, undefined)
})

// Run all tests
test.run()