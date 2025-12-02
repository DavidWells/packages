// Tests for getCurrentBranch utility
const { test } = require('uvu')
const assert = require('uvu/assert')
const { getCurrentBranch } = require('./getCurrentBranch')

test('getCurrentBranch returns a string', async () => {
  const branch = await getCurrentBranch()
  assert.type(branch, 'string')
  assert.ok(branch.length > 0, 'branch name should not be empty')
})

test('getCurrentBranch returns expected branch name', async () => {
  const branch = await getCurrentBranch()
  // We're on master based on git status
  assert.is(branch, 'master')
})

test.run()
