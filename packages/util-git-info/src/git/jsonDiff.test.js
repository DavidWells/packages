// Tests for rfc6902 and jsonpointer usage (used in gitJSONToGitDSL)
const { test } = require('uvu')
const assert = require('uvu/assert')
const jsonDiff = require('rfc6902')
const jsonpointer = require('jsonpointer')

// Tests for rfc6902.createPatch - used in JSONPatchForFile
test('rfc6902.createPatch detects added keys', () => {
  const before = { name: 'test' }
  const after = { name: 'test', version: '1.0.0' }
  const patch = jsonDiff.createPatch(before, after)

  assert.is(patch.length, 1)
  assert.is(patch[0].op, 'add')
  assert.is(patch[0].path, '/version')
  assert.is(patch[0].value, '1.0.0')
})

test('rfc6902.createPatch detects removed keys', () => {
  const before = { name: 'test', version: '1.0.0' }
  const after = { name: 'test' }
  const patch = jsonDiff.createPatch(before, after)

  assert.is(patch.length, 1)
  assert.is(patch[0].op, 'remove')
  assert.is(patch[0].path, '/version')
})

test('rfc6902.createPatch detects changed values', () => {
  const before = { version: '1.0.0' }
  const after = { version: '2.0.0' }
  const patch = jsonDiff.createPatch(before, after)

  assert.is(patch.length, 1)
  assert.is(patch[0].op, 'replace')
  assert.is(patch[0].path, '/version')
  assert.is(patch[0].value, '2.0.0')
})

test('rfc6902.createPatch handles nested objects', () => {
  const before = { deps: { lodash: '4.0.0' } }
  const after = { deps: { lodash: '4.0.0', axios: '1.0.0' } }
  const patch = jsonDiff.createPatch(before, after)

  assert.is(patch.length, 1)
  assert.is(patch[0].op, 'add')
  assert.is(patch[0].path, '/deps/axios')
})

test('rfc6902.createPatch handles arrays', () => {
  const before = { items: ['a', 'b'] }
  const after = { items: ['a', 'b', 'c'] }
  const patch = jsonDiff.createPatch(before, after)

  assert.is(patch.length, 1)
  assert.is(patch[0].op, 'add')
  assert.is(patch[0].path, '/items/-') // RFC 6902 uses - for array append
  assert.is(patch[0].value, 'c')
})

test('rfc6902.createPatch returns empty array for identical objects', () => {
  const obj = { name: 'test', version: '1.0.0' }
  const patch = jsonDiff.createPatch(obj, obj)

  assert.is(patch.length, 0)
})

// Tests for jsonpointer.get - used in JSONDiffForFile
test('jsonpointer.get retrieves root level values', () => {
  const obj = { name: 'test', version: '1.0.0' }

  assert.is(jsonpointer.get(obj, '/name'), 'test')
  assert.is(jsonpointer.get(obj, '/version'), '1.0.0')
})

test('jsonpointer.get retrieves nested values', () => {
  const obj = { deps: { lodash: '4.0.0' } }

  assert.is(jsonpointer.get(obj, '/deps/lodash'), '4.0.0')
  assert.equal(jsonpointer.get(obj, '/deps'), { lodash: '4.0.0' })
})

test('jsonpointer.get retrieves array elements', () => {
  const obj = { items: ['a', 'b', 'c'] }

  assert.is(jsonpointer.get(obj, '/items/0'), 'a')
  assert.is(jsonpointer.get(obj, '/items/2'), 'c')
})

test('jsonpointer.get returns undefined for missing paths', () => {
  const obj = { name: 'test' }

  assert.is(jsonpointer.get(obj, '/missing'), undefined)
  assert.is(jsonpointer.get(obj, '/deep/missing/path'), undefined)
})

// Tests for jsonpointer.set - used in JSONDiffForFile
test('jsonpointer.set creates root level values', () => {
  const obj = {}
  jsonpointer.set(obj, '/name', 'test')

  assert.is(obj.name, 'test')
})

test('jsonpointer.set creates nested values', () => {
  const obj = { deps: {} }
  jsonpointer.set(obj, '/deps/lodash', '4.0.0')

  assert.is(obj.deps.lodash, '4.0.0')
})

test('jsonpointer.set overwrites existing values', () => {
  const obj = { version: '1.0.0' }
  jsonpointer.set(obj, '/version', '2.0.0')

  assert.is(obj.version, '2.0.0')
})

// Integration test - simulates JSONDiffForFile behavior
test('integration: build diff object from patches', () => {
  const before = {
    name: 'my-pkg',
    dependencies: { lodash: '4.0.0' }
  }
  const after = {
    name: 'my-pkg',
    dependencies: { lodash: '4.0.0', axios: '1.0.0' }
  }

  const patches = jsonDiff.createPatch(before, after)
  const result = Object.create(null)

  for (const patch of patches) {
    const pathSteps = patch.path.split('/')
    const backAStepPath = pathSteps.length <= 2
      ? patch.path
      : pathSteps.slice(0, pathSteps.length - 1).join('/')

    const diff = {
      before: jsonpointer.get(before, backAStepPath) || null,
      after: jsonpointer.get(after, backAStepPath) || null
    }
    jsonpointer.set(result, backAStepPath, diff)
  }

  assert.equal(result.dependencies, {
    before: { lodash: '4.0.0' },
    after: { lodash: '4.0.0', axios: '1.0.0' }
  })
})

test.run()
