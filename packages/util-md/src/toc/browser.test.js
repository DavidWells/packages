const { test } = require('uvu')
const assert = require('uvu/assert')

function withoutProcess(callback) {
  const hadProcess = Object.prototype.hasOwnProperty.call(global, 'process')
  const originalProcess = global.process

  try {
    global.process = undefined
    callback()
  } finally {
    if (hadProcess) {
      global.process = originalProcess
    } else {
      delete global.process
    }
  }
}

function clearModule(modulePath) {
  delete require.cache[require.resolve(modulePath)]
}

test('toc loads and generates output without a process global', () => {
  withoutProcess(() => {
    clearModule('./')
    clearModule('./index')
    clearModule('./tree-build')
    clearModule('./tree-stringify')
    clearModule('../find-headings')
    clearModule('../utils/slugger')

    const { generateToc } = require('./')
    const toc = generateToc('# Title\n\n## One\n\n### Two\n', {
      stripFirstH1: true,
      maxDepth: 3,
    })

    assert.is(toc.text, '- [One](#one)\n  - [Two](#two)')
  })
})

test('logger loads without a process global', () => {
  withoutProcess(() => {
    clearModule('../utils/logger')

    const { deepLog, logger } = require('../utils/logger')

    assert.is(typeof deepLog, 'function')
    assert.is(typeof logger, 'function')
  })
})

test.run()
