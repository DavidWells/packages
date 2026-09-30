// parseDiffFiles must return the same from/to/new/deleted (and throw the same errors)
// as parse-diff, which it replaces in diffToGitJSONDSL
const { execFileSync } = require('child_process')
const path = require('path')
const { test } = require('uvu')
const assert = require('uvu/assert')
const parseDiff = require('parse-diff')
const { parseDiffFiles } = require('./parseDiffFiles')

const project = (files) => files.map(f => ({ from: f.from, to: f.to, new: f.new, deleted: f.deleted }))
const run = (fn, input) => {
  try {
    return { files: project(fn(input)) }
  } catch (e) {
    return { error: `${e.constructor.name}: ${e.message}` }
  }
}
const assertSame = (input) => assert.equal(run(parseDiffFiles, input), run(parseDiff, input))

const EDGE_CASES = [
  '',
  ' \n\t',
  'diff --git a/x b/x\nnew file mode 100644\nindex 0000000..e69de29\n',
  'diff --git a/old name.txt b/new name.txt\nsimilarity index 100%\nrename from old name.txt\nrename to new name.txt\n',
  'diff --git a/a b/b a.txt b/a b/b a renamed.txt\nsimilarity index 90%\n--- a/a b/b a.txt\n+++ b/a b/b a renamed.txt\n@@ -1 +1,2 @@\n x\n+y\n',
  'diff --git "a/caf\\303\\251.txt" "b/caf\\303\\251.txt"\n--- "a/caf\\303\\251.txt"\n+++ "b/caf\\303\\251.txt"\n@@ -1 +1 @@\n-a\n+b\n',
  'diff --git a/bin b/bin\nindex 1111111..2222222 100644\nBinary files a/bin and b/bin differ\n',
  'diff --git a/x b/x\n--- a/x\n+++ b/x\n@@ -1,2 +1,2 @@\n--- not a header\n+++ not a header\n@@ -1 +1 @@\n-a\n+b\n',
  'diff --git a/x b/x\r\ndeleted file mode 100644\r\n--- a/x\r\n+++ /dev/null\r\n@@ -1 +0,0 @@\r\n-a\r\n',
  'diff --git a/x b/x\n--- a/x\t2020-01-01 00:00:00.000 +0000\n+++ b/x\t2020-01-01 00:00:00.000 +0000\n@@ -1 +1 @@\n-a\n\\ No newline at end of file\n+b\n\\ No newline at end of file\n',
  'diff --cc conflict.txt\nindex 1..2\n',
  '@@ -1 +1 @@\n+x',
  '\\ No newline at end of file',
  'diff --git a/x b/x\n@@ -1 +1 @@\n\\ No newline at end of file',
]

test('parseDiffFiles matches parse-diff on edge cases', () => {
  EDGE_CASES.forEach(assertSame)
})

test('parseDiffFiles matches parse-diff on this repo\'s history', () => {
  const cwd = path.resolve(__dirname, '../../..')
  let diffs
  try {
    const shas = execFileSync('git', ['rev-list', '--max-count=40', 'HEAD'], { cwd, encoding: 'utf8' }).trim().split('\n')
    diffs = shas.map(sha => execFileSync('git', ['show', '--format=', '-m', '--first-parent', sha], { cwd, encoding: 'utf8', maxBuffer: 1 << 28 }))
  } catch (e) {
    return // not running inside a git checkout
  }
  diffs.forEach(assertSame)
})

test.run()
