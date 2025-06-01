# Matcher

A flexible utility for matching and finding items based on various criteria. This utility provides functions to match items against strings, regular expressions, functions, arrays, or objects.

## Installation

```bash
npm install @davidwells/matcher
```

## Usage

The matcher utility provides three main functions:

- `matchItem`: Check if an item matches specific criteria
- `findMatchingItems`: Find all items that match the criteria
- `findFirstMatch`: Find the first item that matches the criteria

### Basic Examples

```javascript
const { matchItem, findMatchingItems, findFirstMatch } = require('@davidwells/matcher')

// Sample items
const items = [
  { text: 'Apple', match: 'fruit.apple' },
  { text: 'Banana', match: 'fruit.banana' },
  { text: 'Carrot', match: 'vegetable.carrot' }
]

// Match by string
matchItem(items[0], 'fruit.apple') // true
matchItem(items[0], 'Apple') // true

// Match by regex
matchItem(items[0], /fruit/) // true

// Match by function
matchItem(items[0], item => item.text.startsWith('A')) // true

// Find all fruits
const fruits = findMatchingItems(items, /fruit/)
// [{ text: 'Apple', match: 'fruit.apple' }, { text: 'Banana', match: 'fruit.banana' }]

// Find first vegetable
const vegetable = findFirstMatch(items, /vegetable/)
// { text: 'Carrot', match: 'vegetable.carrot' }
```

## API Reference

### `matchItem(itemOrItems, matcher)`

Determines if an item matches the specified matcher criteria.

#### Parameters

- `itemOrItems` (Item|Array<Item>): The item or array of items to check
- `matcher` (ValidMatcher|Array<ValidMatcher>): The criteria to match against

#### Returns

- `boolean`: True if the item matches the criteria, false otherwise

### `findMatchingItems(items, matcher)`

Find all items that match the specified criteria.

#### Parameters

- `items` (Array<Item>): Array of items to search
- `matcher` (ValidMatcher): The criteria to match against

#### Returns

- `Array<Item>`: Array of matching items

### `findFirstMatch(items, matcher)`

Find the first item that matches the specified criteria.

#### Parameters

- `items` (Array<Item>): Array of items to search
- `matcher` (ValidMatcher): The criteria to match against

#### Returns

- `Item|undefined`: First matching item or undefined if none found

## Valid Matcher Types

The matcher utility supports the following types of matchers:

1. **String**: Matches against item's `text` or `match` property
2. **Function**: Custom matching function that returns a boolean
3. **RegExp**: Regular expression to test against item's `text` or `match` property
4. **Array**: Array of matchers (any match succeeds)
5. **Object**: Object with a `match` property containing a valid matcher

## Item Structure

Items should follow this structure:

```typescript
interface Item {
  text: string;      // The display text of the item
  match: string;     // The matching identifier of the item
  index?: number;    // Optional index position of the item
}
```

## Alt libs

- https://github.com/arlac77/matching-iterator/tree/master
- Path matcher https://github.com/arlac77/multi-path-matcher