const fs = require('fs')
const os = require('os')
const path = require('path')
const { execFileSync } = require('child_process')
const { test } = require('uvu')
const assert = require('uvu/assert')

const { getFileAtCommit } = require('./getFileAtCommit')
const { localGetFileAtSHA } = require('./localGetFileAtSHA')
const { localGetDiff } = require('./localGetDiff')
const { localGetNumstat } = require('./localGetNumstat')
const { getCommit } = require('./commits/getCommit')
const { getCommitBranch } = require('./commits/getCommitBranch')
const { getFirstCommitHash } = require('./commits/getFirstCommit')
const { spawnGit } = require('./utils/exec')

/** Asserts the promise from `fn` rejects, with a message matching `re` when given */
async function rejects(fn, re) {
  let err
  try {
    await fn()
  } catch (e) {
    err = e
  }
  assert.ok(err, 'expected a rejection')
  if (re) assert.match(String(err && err.message || err), re)
}

/** Temp repo with one commit on `main` holding package.json and a file named `it's.txt` */
function makeRepo() {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'git-er-done-refs-')))
  const git = (...args) => execFileSync('git', args, { cwd: dir, encoding: 'utf8' }).trim()
  git('init', '-q', '-b', 'main')
  git('config', 'user.email', 'test@example.com')
  git('config', 'user.name', 'Test')
  git('config', 'commit.gpgsign', 'false')
  fs.writeFileSync(path.join(dir, 'package.json'), '{"name":"x"}\n')
  fs.writeFileSync(path.join(dir, "it's.txt"), 'quote\n')
  git('add', '-A')
  git('commit', '-qm', 'init')
  return { dir, git, cleanup: () => fs.rmSync(dir, { recursive: true, force: true }) }
}

test('getFileAtCommit: shell syntax in the sha is not executed', async () => {
  const repo = makeRepo()
  const marker = path.join(repo.dir, 'pwned')
  try {
    const out = await getFileAtCommit('package.json', `HEAD:package.json >/dev/null; touch ${marker}; echo`, { cwd: repo.dir })
    assert.is(out, undefined)
    assert.is(fs.existsSync(marker), false)
  } finally {
    repo.cleanup()
  }
})

test('getFileAtCommit: a sha starting with "-" is refused, not passed to git as an option', async () => {
  const repo = makeRepo()
  const target = path.join(repo.dir, 'written')
  try {
    await rejects(() => getFileAtCommit('package.json', `--output=${target}`, { cwd: repo.dir }), /must not start with "-"/)
    await rejects(() => localGetFileAtSHA('package.json', null, `--output=${target}`, { cwd: repo.dir }), /must not start with "-"/)
    assert.is(fs.existsSync(target), false)
  } finally {
    repo.cleanup()
  }
})

test('getFileAtCommit: keeps the empty-sha error and reads normal refs and quoted names', async () => {
  const repo = makeRepo()
  try {
    await rejects(() => getFileAtCommit('package.json', '', { cwd: repo.dir }), /SHA must be a non-empty string/)
    assert.is(await getFileAtCommit('package.json', 'HEAD', { cwd: repo.dir }), '{"name":"x"}\n')
    assert.is(await getFileAtCommit('package.json', 'main', { cwd: repo.dir }), '{"name":"x"}\n')
    assert.is(await localGetFileAtSHA("it's.txt", null, 'HEAD', { cwd: repo.dir }), 'quote\n')
    assert.is(await getFileAtCommit('missing.json', 'HEAD', { cwd: repo.dir }), undefined)
  } finally {
    repo.cleanup()
  }
})

test('getCommit: a hash followed by shell syntax is refused', () => {
  assert.throws(() => getCommit('abcdef1; touch pwned'), /Must use git hash/)
  assert.throws(() => getCommit('x abcdef1'), /Must use git hash/)
})

test('getCommitBranch: resolves the branches that contain the commit', async () => {
  const repo = makeRepo()
  try {
    const sha = repo.git('rev-parse', 'HEAD')
    repo.git('branch', 'other')
    assert.equal(await getCommitBranch(sha, { cwd: repo.dir }), ['* main', 'other'])
    await rejects(() => getCommitBranch('--help', { cwd: repo.dir }), /must not start with "-"/)
  } finally {
    repo.cleanup()
  }
})

test('getFirstCommitHash: one hash even when the repo has several root commits', async () => {
  const repo = makeRepo()
  try {
    const first = repo.git('rev-parse', 'HEAD')
    repo.git('checkout', '-q', '--orphan', 'second-root')
    repo.git('commit', '-qm', 'second root')
    repo.git('checkout', '-q', 'main')
    repo.git('merge', '-q', '--allow-unrelated-histories', '-m', 'merge roots', 'second-root')
    const hash = await getFirstCommitHash({ cwd: repo.dir })
    assert.match(hash, /^[0-9a-f]{40}$/)
    assert.ok([first, repo.git('rev-parse', 'second-root')].includes(hash))
  } finally {
    repo.cleanup()
  }
})

test('spawnGit: stderr output on a successful exit resolves', async () => {
  const repo = makeRepo()
  try {
    // `git checkout -b` reports "Switched to a new branch" on stderr and exits 0
    assert.is(await spawnGit(['checkout', '-b', 'feature'], repo.dir), '')
  } finally {
    repo.cleanup()
  }
})

test('spawnGit: a non-zero exit without stderr rejects instead of hanging', async () => {
  const repo = makeRepo()
  try {
    fs.writeFileSync(path.join(repo.dir, 'package.json'), '{"name":"y"}\n')
    // `git diff --exit-code` exits 1 on differences and writes nothing to stderr
    await rejects(() => spawnGit(['diff', '--exit-code', '--quiet'], repo.dir), /exited with code 1/)
  } finally {
    repo.cleanup()
  }
})

test('localGetDiff / localGetNumstat: bad refs reject; leading "-" refs are refused', async () => {
  const repo = makeRepo()
  const errors = console.error
  console.error = () => {}
  try {
    await rejects(() => localGetDiff('no-such-ref', 'HEAD', repo.dir))
    await rejects(() => localGetNumstat('no-such-ref', 'HEAD', repo.dir))
    await rejects(() => localGetDiff('--output=x', 'HEAD', repo.dir), /must not start with "-"/)
    await rejects(() => localGetNumstat('HEAD', '--output=x', repo.dir), /must not start with "-"/)
    assert.is(await localGetNumstat('HEAD', 'HEAD', repo.dir), 0)
    assert.is(await localGetDiff('HEAD', 'HEAD', repo.dir), '')
  } finally {
    console.error = errors
    repo.cleanup()
  }
})

test.run()
