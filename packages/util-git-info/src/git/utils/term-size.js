const process = require('process')
const { execFileSync } = require('child_process')
const fs = require('fs')
const tty = require('tty')

const defaultColumns = 80
const defaultRows = 24

/**
 * @typedef {Object} TerminalSize
 * @property {number} columns - Number of columns in the terminal
 * @property {number} rows - Number of rows in the terminal
 */

/** @type {TerminalSize|undefined} */
let sizeCache

// @ts-ignore
function exec(command, arguments_, { shell, env } = {}) {
  return execFileSync(command, arguments_, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
    timeout: 500,
    shell,
    env,
  }).trim()
}

function create(columns, rows) {
  return {
    columns: Number.parseInt(columns, 10),
    rows: Number.parseInt(rows, 10),
  }
}

function createIfNotDefault(maybeColumns, maybeRows) {
  const { columns, rows } = create(maybeColumns, maybeRows)

  if (Number.isNaN(columns) || Number.isNaN(rows)) {
    return
  }

  if (columns === defaultColumns && rows === defaultRows) {
    return
  }

  return { columns, rows }
}

function devTty() {
  try {
    // eslint-disable-next-line no-bitwise
    // @ts-ignore - O_EVTONLY is macOS-specific
    const flags = process.platform === 'darwin' ? fs.constants.O_EVTONLY | fs.constants.O_NONBLOCK : fs.constants.O_NONBLOCK
    // eslint-disable-next-line new-cap
    // @ts-ignore
    const { columns, rows } = tty.WriteStream(fs.openSync('/dev/tty', flags))
    return { columns, rows }
  } catch {}
}

// On macOS, this only returns correct values when stdout is not redirected.
function tput() {
  try {
    // `tput` requires the `TERM` environment variable to be set.
    const columns = exec('tput', ['cols'], { env: { TERM: 'dumb', ...process.env } })
    const rows = exec('tput', ['lines'], { env: { TERM: 'dumb', ...process.env } })

    if (columns && rows) {
      return createIfNotDefault(columns, rows)
    }
  } catch {}
}

// Only exists on Linux.
function resize() {
  // `resize` is preferred as it works even when all file descriptors are redirected
  // https://linux.die.net/man/1/resize
  try {
    const size = exec('resize', ['-u']).match(/\d+/g)

    if (size.length === 2) {
      return createIfNotDefault(size[0], size[1])
    }
  } catch {}
}

function terminalSize() {
  // Return cached size if available for performance.
  if (sizeCache) {
    return sizeCache
  }

  const { env, stdout, stderr } = process

  if (stdout?.columns && stdout?.rows) {
    sizeCache = create(stdout.columns, stdout.rows)
    return sizeCache
  }

  if (stderr?.columns && stderr?.rows) {
    sizeCache = create(stderr.columns, stderr.rows)
    return sizeCache
  }

  // These values are static, so not the first choice.
  if (env.COLUMNS && env.LINES) {
    sizeCache = create(env.COLUMNS, env.LINES)
    return sizeCache
  }

  const fallback = {
    columns: defaultColumns,
    rows: defaultRows,
  }

  if (process.platform === 'win32') {
    // We include `tput` for Windows users using Git Bash.
    sizeCache = tput() ?? fallback
    return sizeCache
  }

  if (process.platform === 'darwin') {
    sizeCache = devTty() ?? tput() ?? fallback
    return sizeCache
  }

  sizeCache = devTty() ?? tput() ?? resize() ?? fallback
  return sizeCache
}

if (require.main === module) {
  console.log(terminalSize())
}

module.exports = terminalSize
