const { test } = require('uvu')
const assert = require('uvu/assert')
const strftime = require('strftime')
const { parseTime } = require('./')

test('parse never', function (t) {
  const time = parseTime('never')
  assert.equal(time.toISOString(), '9999-12-31T00:00:00.000Z')
})

test('parse now', function (t) {
  const nowDate = new Date()
  const time = parseTime('now',  { now: nowDate })
  assert.equal(time.toISOString(), nowDate.toISOString())

  const nowDateTwo = new Date()
  const timeTwo = parseTime('now',  { now: nowDateTwo })
  assert.equal(timeTwo.toISOString(), nowDateTwo.toISOString())
})

test('parse unix timestamp', function (t) {
  const timestamp = 1672574400 // 2023-01-01T12:00:00Z
  const time = parseTime(timestamp)
  assert.equal(time.toISOString(), '2023-01-01T12:00:00.000Z')
})

test('parse Date object', function (t) {
  const dateObj = new Date('2023-05-15T10:30:00Z')
  const time = parseTime(dateObj)
  assert.equal(time.toISOString(), '2023-05-15T10:30:00.000Z')
})


test('parse relative times', function (t) {
  const nowDate = new Date('2023-01-01T12:00:00Z')

  const relativeOne = parseTime('in 2 hours', { now: nowDate }).toISOString()
  // console.log('relativeOne', relativeOne)
  assert.equal(relativeOne, '2023-01-01T14:00:00.000Z', 'in 2 hours')

  const relativeTwo = parseTime('3 days ago', { now: nowDate }).toISOString()
  // console.log('relativeTwo', relativeTwo)
  assert.equal(relativeTwo, '2022-12-29T12:00:00.000Z', '3 days ago')

  const relativeThree = parseTime('next week', { now: nowDate }).toISOString()
  // console.log('relativeThree', relativeThree)
  assert.equal(relativeThree, '2023-01-08T12:00:00.000Z', 'next week')
})

test('parse specific dates and times', function (t) {
  const nowDate = new Date('2023-01-01T12:00:00Z')
  assert.equal(
    strftime('%F %T', parseTime('January 15th 2024 at 3:30pm', { now: nowDate })),
    '2024-01-15 15:30:00',
    'January 15th 2024 at 3:30pm'
  )

  assert.equal(
    strftime('%F %T', parseTime('Dec 25 2023 midnight', { now: nowDate })),
    '2023-12-25 00:00:00',
    'Dec 25 2023 midnight'
  )

  assert.equal(
    strftime('%F %T', parseTime('July 4 2023 noon', { now: nowDate })),
    '2023-07-04 12:00:00',
    'July 4 2023 noon'
  )
})

test('parse special keywords', function (t) {
  const nowDate = new Date('2023-06-15T09:00:00Z')

  assert.equal(
    strftime('%F %T', parseTime('today at 5pm', { now: nowDate })),
    '2023-06-15 17:00:00',
    'today at 5pm'
  )

  assert.equal(
    strftime('%F %T', parseTime('yesterday noon', { now: nowDate })),
    '2023-06-14 12:00:00',
    'yesterday noon'
  )

  assert.equal(
    strftime('%F %T', parseTime('tomorrow at midnight', { now: nowDate })),
    '2023-06-16 00:00:00',
    'tomorrow at midnight'
  )

})


test('parse dates', function (t) {
  var tomorrow = new Date(new Date().valueOf() + 24 * 60 * 60 * 1000)

  // Tue Apr 14 2015 09:46:01 GMT-0700 (PDT)
  var optsd = { now: new Date(1429029961000) }

  assert.equal(strftime('%T', parseTime('11am')), '11:00:00')
  assert.equal(strftime('%T', parseTime('11pm')), '23:00:00')
  assert.equal(strftime('%T', parseTime('12:30am')), '00:30:00')
  assert.equal(strftime('%T', parseTime('12:30pm')), '12:30:00')
  assert.equal(strftime('%F %T', parseTime('tomorrow at 7')), strftime('%F 07:00:00', tomorrow))
  assert.equal(strftime('%F %T', parseTime('aug 25 2015 5pm')), '2015-08-25 17:00:00')
  assert.equal(
    strftime(
      '%F %T',
      parseTime('this friday', {
        now: new Date(1429029961000),
      }),
    ),
    '2015-04-17 00:00:00',
  )
  assert.equal(
    strftime(
      '%F %T',
      parseTime('friday', {
        now: new Date(1429029961000),
      }),
    ),
    '2015-04-17 00:00:00',
  )
  assert.equal(
    strftime(
      '%F %T',
      parseTime('this friday', {
        now: new Date(1429721563259),
      }),
    ),
    '2015-04-24 00:00:00',
  )
  assert.equal(
    strftime(
      '%F %T',
      parseTime('monday', {
        now: new Date(1429032952407),
      }),
    ),
    '2015-04-20 00:00:00',
  )
  assert.equal(
    strftime(
      '%F %T',
      parseTime('next friday', {
        now: new Date(1429721563259),
      }),
    ),
    '2015-05-01 00:00:00',
  )
  assert.equal(
    strftime(
      '%F %T',
      parseTime('next monday', {
        now: new Date(1429033187172),
      }),
    ),
    '2015-04-27 00:00:00',
  )
  assert.equal(
    strftime(
      '%F %T',
      parseTime('last monday', {
        now: new Date(1429033187172),
      }),
    ),
    '2015-04-13 00:00:00',
  )
  assert.equal(
    strftime(
      '%F %T',
      parseTime('last tuesday', {
        now: new Date(1429033187172),
      }),
    ),
    '2015-04-07 00:00:00',
  )
  assert.equal(strftime('%F %T', parseTime('oct 22nd 1987')), '1987-10-22 00:00:00')
  assert.equal(strftime('%F %T', parseTime('3pm oct 22nd 1987')), '1987-10-22 15:00:00')
  assert.equal(strftime('%F %T', parseTime('oct 22nd 1987 6am')), '1987-10-22 06:00:00')
  assert.equal(strftime('%F %T', parseTime('the 22nd of october, 1987 at 7pm')), '1987-10-22 19:00:00')
  assert.equal(strftime('%F', parseTime('4th of july', optsd)), '2015-07-04')
  assert.equal(strftime('%F %T', parseTime('9pm on the 4th of july', optsd)), '2015-07-04 21:00:00')
  assert.equal(strftime('%F %T', parseTime('in 12 minutes', optsd)), '2015-04-14 09:58:01', 'in 12 minutes')
  assert.equal(strftime('%F %T', parseTime('in 2 hours', optsd)), '2015-04-14 11:46:01', 'in 2 hours')
  assert.equal(strftime('%F %T', parseTime('in 31 hours', optsd)), '2015-04-15 16:46:01', 'in 31 hours')
  assert.equal(strftime('%F %T', parseTime('in 20 hours 40 minutes', optsd)), '2015-04-15 06:26:01', 'in 20 hours 40 minutes')
  assert.equal(
    strftime('%F %T', parseTime('in 20 hours and 40 minutes', optsd)),
    '2015-04-15 06:26:01',
    'in 20 hours and 40 minutes',
  )
  assert.equal(strftime('%F %T', parseTime('in 20.2h', optsd)), '2015-04-15 05:58:01', 'in 20.2h')
  assert.equal(strftime('%F %T', parseTime('in 5 weeks', optsd)), '2015-05-19 09:46:01', 'in 5 weeks')
  assert.equal(strftime('%F %T', parseTime('in 2 years', optsd)), '2017-04-14 09:46:01', 'in 2 years')
  assert.equal(strftime('%F %T', parseTime('in 2 years and 5 weeks', optsd)), '2017-05-19 09:46:01', 'in 2 years and 5 weeks')
  assert.equal(strftime('%F %T', parseTime('in 1.5 weeks', optsd)), '2015-04-24 09:46:01', 'in 1.5 weeks')
  assert.equal(strftime('%F %T', parseTime('2 days ago', optsd)), '2015-04-12 09:46:01', '2 days ago')
  assert.equal(strftime('%F %T', parseTime('2 days and 6 hours ago', optsd)), '2015-04-12 03:46:01', '2 days and 6 hours ago')
  assert.equal(strftime('%F %T', parseTime('1 month ago', optsd)), '2015-03-14 09:46:01', '1 month ago')
  assert.equal(strftime('%F %T', parseTime('yesterday', optsd)), '2015-04-13 00:00:00', 'yesterday')
  assert.equal(strftime('%F %T', parseTime('yesterday at 8am', optsd)), '2015-04-13 08:00:00', 'yesterday')
  assert.equal(strftime('%F %T', parseTime('today at 8am', optsd)), '2015-04-14 08:00:00', 'today at 8am')
  assert.equal(strftime('%F %T', parseTime('now', optsd)), '2015-04-14 09:46:01', 'now')
  assert.equal(strftime('%F %T', parseTime('14 days ago', optsd)), '2015-03-31 09:46:01', '14 days ago')
  assert.equal(strftime('%F %T', parseTime('2015-10-31', optsd)), '2015-10-31 00:00:00', 'YYYY-MM-DD')
  assert.equal(strftime('%F %T', parseTime('2015-10-31 20:30', optsd)), '2015-10-31 20:30:00', 'YYYY-MM-DD HH:MM')
  assert.equal(strftime('%F %T', parseTime('2015-10-31 8:30pm', optsd)), '2015-10-31 20:30:00', 'YYYY-MM-DD informal')
  assert.equal(strftime('%F', parseTime('sunday may 22nd', optsd)), '2015-05-22', 'sunday may 22nd')
  assert.equal(strftime('%F', parseTime('sunday may 22nd 2016', optsd)), '2016-05-22', 'sunday may 22nd 2016')
  assert.equal(strftime('%F', parseTime('jan 15', optsd)), '2016-01-15', 'jan 15')
  assert.equal(strftime('%F', parseTime('apr 1', optsd)), '2015-04-01', 'apr 1')
  assert.equal(
    strftime(
      '%F',
      parseTime('this sunday', {
        now: new Date('2016-05-31 00:00'),
      }),
    ),
    '2016-06-05',
    'this sunday',
  )
  assert.equal(strftime('%F', parseTime('the 1st', optsd)), '2015-04-01', 'the 1st')
  assert.equal(strftime('%F', parseTime('the 2nd', optsd)), '2015-04-02', 'the 2nd')
  assert.equal(strftime('%F', parseTime('the 3rd', optsd)), '2015-04-03', 'the 3rd')
  assert.equal(strftime('%F', parseTime('the 4th', optsd)), '2015-04-04', 'the 4th')
  assert.equal(strftime('%F', parseTime('the 10th', optsd)), '2015-04-10', 'the 10th')
  assert.equal(strftime('%F %T', parseTime('tomorrow at noon', optsd)), '2015-04-15 12:00:00', 'tomorrow at noon')
  assert.equal(strftime('%F %T', parseTime('in 6 days at midnight', optsd)), '2015-04-20 00:00:00', 'in 6 days at midnight')
})

// @TODO Cases
// 'next decade'

test.run()