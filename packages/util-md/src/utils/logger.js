const DEBUG = typeof process !== 'undefined' &&
  process &&
  Array.isArray(process.argv) &&
  process.argv.includes('--debug')

const logger = DEBUG ? deepLog : () => {}

function formatObject(value) {
  try {
    return JSON.stringify(value, null, 2)
  } catch (err) {
    return String(value)
  }
}

function logValue(value, isFirst, isLast) {
  const prefix = `${isFirst ? '> ' : ''}`
  if (typeof value === 'object') {
    console.log(`${formatObject(value)}\n`)
    return
  }
  if (isFirst) {
    console.log(`\n\x1b[33m${prefix}${value}\x1b[0m`)
    return
  }
  console.log((typeof value === 'string' && value.includes('\n')) ? `\`${value}\`` : value)
  // isLast && console.log(`\x1b[37m\x1b[1m${'─'.repeat(94)}\x1b[0m\n`)
}

function deepLog() {
  for (let i = 0; i < arguments.length; i++) logValue(arguments[i], i === 0, i === arguments.length - 1)
}

module.exports = {
  deepLog,
  logger,
}
