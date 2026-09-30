// localGetCommits against a real repo: commit text that broke the JSON-shaped parser
// (quotes, braces, backslashes, JSON-looking bodies) and ranges larger than one stdout
// chunk (records split across chunks used to fail with a JSON5 SyntaxError).
const fs = require('fs')
const os = require('os')
const path = require('path')
const { execFileSync } = require('child_process')
const { test } = require('uvu')
const assert = require('uvu/assert')
const { localGetCommits, parseCommitRecords, formatRecords } = require('./localGetCommits')

const git = (cwd, ...args) => execFileSync('git', args, { cwd, encoding: 'utf8', env: { ...process.env, GIT_AUTHOR_NAME: 'Ann "A" Author', GIT_AUTHOR_EMAIL: 'ann@example.com', GIT_COMMITTER_NAME: 'Cy Committer', GIT_COMMITTER_EMAIL: 'cy@example.com' } })

function makeRepo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-er-done-commits-'))
  git(dir, 'init', '-q', '-b', 'main')
  git(dir, 'config', 'commit.gpgsign', 'false')
  fs.writeFileSync(path.join(dir, 'f.txt'), '0')
  git(dir, 'add', '-A')
  git(dir, 'commit', '-q', '-m', 'base')
  return dir
}

function commit(dir, message, i) {
  fs.writeFileSync(path.join(dir, 'f.txt'), String(i))
  git(dir, 'commit', '-q', '-am', message)
}

const TRICKY = [
  'fix: handle "quoted" values and {braces}',
  'feat: backslashes \\ and \\n literal, tab\there',
  'chore: JSON-looking body\n\n{"a": 1, "b": "c"}\n- Error: "x" at 1:2\nSigned-off-by: Ann <ann@example.com>',
  'docs: unicode ✓ – “smart quotes” and a trailing comma,',
  "refactor: it's a 'single-quoted' subject\n\nmulti\nline\n\nbody",
]

test('tricky commit text parses exactly, newest first', async () => {
  const dir = makeRepo()
  try {
    TRICKY.forEach((m, i) => commit(dir, m, i + 1))
    const commits = await localGetCommits('main~5', 'main', dir)
    assert.is(commits.length, 5)
    const subjects = commits.map((c) => c.subject).reverse()
    assert.equal(subjects, TRICKY.map((m) => m.split('\n')[0]))
    const jsonBody = commits.find((c) => c.subject.startsWith('chore: JSON-looking'))
    assert.ok(jsonBody.body.includes('{"a": 1, "b": "c"}'), 'body kept verbatim')
    assert.not.ok(jsonBody.body.includes('Signed-off-by'), 'Signed-off-by trailer removed')
    assert.is(commits[0].author.name, 'Ann "A" Author')
    assert.is(commits[0].committer.email, 'cy@example.com')
    assert.match(commits[0].authoredOn, /^\d{4}-\d{2}-\d{2}T/)
    assert.ok(Array.isArray(commits[0].parents) && commits[0].parents.length === 1)
  } finally {
    fs.rmSync(dir, { recursive: true, force: true })
  }
})

test('a range bigger than one stdout chunk parses completely', async () => {
  const dir = makeRepo()
  try {
    const body = 'x'.repeat(2000) + ' "quote" {brace}'
    for (let i = 1; i <= 120; i++) commit(dir, `commit ${i}: "${i}"\n\n${body}`, i)
    const commits = await localGetCommits('main~120', 'main', dir)
    assert.is(commits.length, 120, '~240KB of log output, many chunks')
    assert.is(commits[0].subject, 'commit 120: "120"')
    assert.is(commits[119].subject, 'commit 1: "1"')
  } finally {
    fs.rmSync(dir, { recursive: true, force: true })
  }
})

test('empty range -> []', async () => {
  const dir = makeRepo()
  try {
    assert.equal(await localGetCommits('main', 'main', dir), [])
  } finally {
    fs.rmSync(dir, { recursive: true, force: true })
  }
})

test('parseCommitRecords: separators only, no escaping', () => {
  const rec = ['abc', 'p1 p2', 'A', 'a@x', '2026-01-01T00:00:00Z', 'C', 'c@x', '2026-01-02T00:00:00Z', 'sub "q"', 'sub-q', 'body {x}\n'].join('\x1f') + '\x1e'
  const [c] = parseCommitRecords(rec + '\n')
  assert.equal(c.parents, ['p1', 'p2'])
  assert.is(c.subject, 'sub "q"')
  assert.is(c.body, 'body {x}\n')
  assert.match(formatRecords, /%x1f/)
})

test.run()
