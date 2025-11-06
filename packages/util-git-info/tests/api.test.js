const { env, chdir, cwd: getCwd } = require('process')

const { test } = require('uvu')
const assert = require('uvu/assert')

const { gitDetails } = require('../src')

// Runs the git utils against very old commits of @netlify/build so that the
// tests are stable. The following are static statistics for that git range.
const BASE = '862fa5aca8c5441ee37c021259533382895ce50c'
const HEAD = '3a2fc89924f0ef9f0244cad29f1d7404be5fe54b'
const UNKNOWN_COMMIT = 'aaaaaaaa'
const DEFAULT_OPTS = { base: BASE, head: HEAD }

test('Should define all its methods and properties', async () => {
  const git = await gitDetails(DEFAULT_OPTS)
  // console.log('git', git)
  assert.equal(Object.keys(git).sort(), [
    'commits',
    'createdFiles',
    'deletedFiles',
    'dir',
    'fileMatch',
    'lastCommit',
    'linesOfCode',
    'modifiedFiles',
  ])
})

test('Should be callable with no options', async () => {
  const { linesOfCode } = await gitDetails()
  const lines = await linesOfCode()
  assert.ok(Number.isInteger(lines))
})

test('Option "head" should have a default value', async () => {
  const { linesOfCode } = await gitDetails({ base: BASE })
  const lines = await linesOfCode()
  assert.ok(Number.isInteger(lines))
})

test('Options "base" and "head" can be the same commit', async () => {
  const { linesOfCode, modifiedFiles, createdFiles, deletedFiles } = await gitDetails({ base: HEAD, head: HEAD })
  const lines = await linesOfCode()
  assert.is(lines, 0)
  assert.equal(modifiedFiles, [])
  assert.equal(createdFiles, [])
  assert.equal(deletedFiles, [])
})

/*
test('Should error when the option "base" points to an unknown commit', (t) => {
  t.throwsAsync(async () => {
    const x = await gitDetails({ base: UNKNOWN_COMMIT, head: HEAD })
    console.log('x', x)
  }, { message: /Invalid base commit/ })
})
*/

/*
test('Should error when the option "head" points to an unknown commit', (t) => {
  t.throwsAsync(async () => {
    await gitDetails({ base: BASE, head: UNKNOWN_COMMIT })
  }, { message: /Invalid head commit/ })
})
*/

const LINES_OF_CODE = 6490

/*
test.serial('Should allow overriding the current directory', async (t) => {
  const currentCwd = getCwd()
  try {
    chdir('/')
    const { linesOfCode } = await gitDetails({
      ...DEFAULT_OPTS,
      cwd: currentCwd
    })
    t.is(linesOfCode, LINES_OF_CODE)
  } finally {
    chdir(currentCwd)
  }
})
*/

/*
test('Should throw when the current directory is invalid', (t) => {
  t.throwsAsync(async () => {
    await gitDetails({ ...DEFAULT_OPTS, cwd: '/does/not/exist' })
  })
})
*/

test('Should return the number of lines of code', async () => {
  const api = await gitDetails(DEFAULT_OPTS)
  const { linesOfCode } = api
  const lines = await linesOfCode()
  assert.is(lines, LINES_OF_CODE)
})

test('Should return the commits', async () => {
  const { commits } = await gitDetails(DEFAULT_OPTS)
  assert.is(commits.length, 34)
  const [{ sha, author, committer, subject, sanitizedSubject }] = commits
  assert.equal(
    { sha, author, committer, subject, sanitizedSubject },
    {
      sha: '3a2fc89924f0ef9f0244cad29f1d7404be5fe54b',
      author: { name: 'David Wells', email: '' },
      committer: { name: 'David Wells', email: '' },
      subject: 'fix: file case',
      sanitizedSubject: 'fix-file-case',
    },
  )
})

test('Should return the modified/created/deleted files', async () => {
  const api = await gitDetails(DEFAULT_OPTS)
  const { modifiedFiles, createdFiles, deletedFiles } = api
  assert.equal(modifiedFiles, [
    'package.json',
    'packages/Form/README.md',
    'packages/Icon/package.json',
    'packages/Input/example/craco.config.js',
    'packages/Input/example/package-lock.json',
    'packages/Input/example/package.json',
    'packages/_Example/package.json',
    'packages/config-postcss/CHANGELOG.md',
    'packages/config-postcss/package-lock.json',
    'packages/config-postcss/package.json',
    'packages/config-postcss/src/_mixins.js'
  ])
  assert.equal(createdFiles, [
    'README.md',
    'packages/config-eslint/.editorconfig',
    'packages/config-eslint/.gitignore',
    'packages/config-eslint/.npmignore',
    'packages/config-eslint/LICENSE',
    'packages/config-eslint/README.md',
    'packages/config-eslint/check-peer.js',
    'packages/config-eslint/index.js',
    'packages/config-eslint/package.json',
    'packages/config-eslint/postinstall.js',
    'packages/config-eslint/ts.js',
    'packages/config-eslint/tsconfig.json',
    'packages/config-eslint/yarn.lock',
    'packages/config-prettier/README.md',
    'packages/config-prettier/index.json',
    'packages/config-prettier/package.json',
    'packages/util-git-info/.gitignore',
    'packages/util-git-info/LICENSE',
    'packages/util-git-info/README.md',
    'packages/util-git-info/example.js',
    'packages/util-git-info/package-lock.json',
    'packages/util-git-info/package.json',
    'packages/util-git-info/src/chainsmoker.js',
    'packages/util-git-info/src/debug.js',
    'packages/util-git-info/src/git/_tests/localGetCommits.test.js',
    'packages/util-git-info/src/git/diffToGitJSONDSL.js',
    'packages/util-git-info/src/git/gitJSONToGitDSL.js',
    'packages/util-git-info/src/git/localGetCommits.js',
    'packages/util-git-info/src/git/localGetDiff.js',
    'packages/util-git-info/src/git/localGetFileAtSHA.js',
    'packages/util-git-info/src/index.js',
    'packages/util-git-info/src/localGit.js',
    'packages/util-persist-previous-build-assets/.gitignore',
    'packages/util-persist-previous-build-assets/README.md',
    'packages/util-persist-previous-build-assets/_alt-approach.js',
    'packages/util-persist-previous-build-assets/_usage.js',
    'packages/util-persist-previous-build-assets/index.js',
    'packages/util-persist-previous-build-assets/package-lock.json',
    'packages/util-persist-previous-build-assets/package.json',
    'packages/util-persist-previous-build-assets/utils/download.js',
    'packages/util-quick-persist/README.md',
    'packages/util-quick-persist/index.js',
    'packages/util-quick-persist/package.json',
    'scripts/docs.js'
  ])
  assert.equal(deletedFiles, [])
})

test('Should return whether specific files are modified/created/deleted/edited', async () => {
  const { fileMatch } = await gitDetails(DEFAULT_OPTS)
  // Match json files but not package.json
  const matchApi = fileMatch('**/**.json', '!**/package.json')
  const {
    modified,
    modifiedFiles,
    created,
    createdFiles,
    deleted,
    deletedFiles,
    edited,
    editedFiles,
  } = matchApi

  assert.equal(modified, true)
  assert.equal(created, true)
  assert.equal(deleted, false)
  assert.equal(edited, true)

  assert.equal(modifiedFiles, [
    'packages/Input/example/package-lock.json',
    'packages/config-postcss/package-lock.json'
  ])
  assert.equal(createdFiles, [
    'packages/config-eslint/tsconfig.json',
    'packages/config-prettier/index.json',
    'packages/util-git-info/package-lock.json',
    'packages/util-persist-previous-build-assets/package-lock.json'
  ])
  assert.equal(deletedFiles, [])
  assert.equal(editedFiles, [
    'packages/Input/example/package-lock.json',
    'packages/config-postcss/package-lock.json',
    'packages/config-eslint/tsconfig.json',
    'packages/config-prettier/index.json',
    'packages/util-git-info/package-lock.json',
    'packages/util-persist-previous-build-assets/package-lock.json'
  ])
})

test.run()
