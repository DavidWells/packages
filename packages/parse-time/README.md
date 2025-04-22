# @davidwells/parse-time

Parse messy time strings into JavaScript Date objects.

## Installation

```bash
npm install @davidwells/parse-time
```

## Usage

```javascript
const { parseTime } = require('@davidwells/parse-time');

// Parse specific dates and times
const date1 = parseTime('January 15th 2024 at 3:30pm');
console.log(date1.toISOString()); // 2024-01-15T15:30:00.000Z

// Parse relative times
const now = new Date('2023-01-01T12:00:00Z');
const date2 = parseTime('in 2 hours', { now });
console.log(date2.toISOString()); // 2023-01-01T14:00:00.000Z

// Parse special keywords
const date3 = parseTime('today at 5pm', { now });
console.log(date3.toISOString()); // 2023-01-01T17:00:00.000Z

// Parse "never" (returns far future date)
const never = parseTime('never');
console.log(never.toISOString()); // 9999-12-31T00:00:00.000Z

// Parse "now" (returns current time)
const currentTime = parseTime('now');
console.log(currentTime.toISOString()); // Current time in ISO format

// Parse unix timestamp
const timestamp = 1672574400; // 2023-01-01T12:00:00Z
const date4 = parseTime(timestamp);
console.log(date4.toISOString()); // 2023-01-01T12:00:00.000Z

// Parse Date object
const dateObj = new Date('2023-05-15T10:30:00Z');
const date5 = parseTime(dateObj);
console.log(date5.toISOString()); // 2023-05-15T10:30:00.000Z
```

## Supported Formats

The library supports a wide variety of time formats:

- **Specific dates and times**: `January 15th 2024 at 3:30pm`, `Dec 25 2023 midnight`, `July 4 2023 noon`
- **Relative times**: `in 2 hours`, `3 days ago`, `next week`, `next month`
- **Special keywords**: `today at 5pm`, `yesterday noon`, `tomorrow at midnight`
- **Time of day**: `11am`, `11pm`, `12:30am`, `12:30pm`
- **Days of the week**: `this friday`, `next monday`, `last tuesday`
- **Specific dates**: `oct 22nd 1987`, `3pm oct 22nd 1987`, `the 22nd of october, 1987 at 7pm`
- **Holidays**: `4th of july`, `9pm on the 4th of july`
- **Relative periods**: `in 12 minutes`, `in 2 hours`, `in 31 hours`, `in 20 hours 40 minutes`
- **Decimal periods**: `in 20.2h`, `in 1.5 weeks`
- **Longer periods**: `in 5 weeks`, `in 2 years`, `in 2 years and 5 weeks`
- **Past periods**: `2 days ago`, `2 days and 6 hours ago`, `1 month ago`, `14 days ago`
- **ISO format**: `2015-10-31`, `2015-10-31 20:30`, `2015-10-31 8:30pm`

## Options

The `parseTime` function accepts an options object as its second parameter:

```javascript
const options = {
  now: new Date() // Reference date for relative time calculations
}

const date = parseTime('tomorrow at noon', options)
```

## About

Fork of https://github.com/substack/parse-messy-time/blob/master/index.js

## License

MIT
