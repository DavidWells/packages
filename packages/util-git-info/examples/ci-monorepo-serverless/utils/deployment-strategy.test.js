// Tests for deployment strategy classification
const { test } = require('uvu')
const assert = require('uvu/assert')
const { getDeploymentStrategy, matchesPathPattern, extractFunctionName } = require('./deployment-strategy')

test('getDeploymentStrategy returns strategy with reason for env var changes', () => {
  const result = getDeploymentStrategy('functions.hello.env.API_KEY')
  assert.equal(result.strategy, 'fastSdkUpdate')
  assert.ok(result.reason, 'should have a reason')
  assert.ok(result.reason.toLowerCase().includes('env'), 'reason should mention env')
})

test('getDeploymentStrategy returns strategy with reason for provider changes', () => {
  const result = getDeploymentStrategy('provider.timeout')
  assert.equal(result.strategy, 'fullDeploy')
  assert.ok(result.reason, 'should have a reason')
})

test('getDeploymentStrategy returns strategy with reason for events changes', () => {
  const result = getDeploymentStrategy('functions.hello.events')
  assert.equal(result.strategy, 'fullDeploy')
  assert.ok(result.reason, 'should have a reason')
  assert.ok(result.reason.toLowerCase().includes('event'), 'reason should mention events')
})

test('getDeploymentStrategy returns unknown strategy with generic reason', () => {
  const result = getDeploymentStrategy('custom.unknown.path')
  assert.equal(result.strategy, 'fullDeploy')
  assert.ok(result.reason, 'should have a reason for unknown paths')
})

test('extractFunctionName returns function name from path', () => {
  assert.equal(extractFunctionName('functions.hello.env.API_KEY'), 'hello')
  assert.equal(extractFunctionName('functions.authenticateUser.timeout'), 'authenticateUser')
})

test('extractFunctionName returns null for non-function paths', () => {
  assert.equal(extractFunctionName('provider.timeout'), null)
  assert.equal(extractFunctionName('resources.foo'), null)
})

test.run()
