# Git Er Done

Utility for dealing with modified, created, deleted files since a git commit.

![image](https://user-images.githubusercontent.com/532272/70579463-909bd500-1b65-11ea-926f-bc31cb500ec7.png)

## Install

```bash
npm install git-er-done
```

## Usage

### Basic Usage

```js
const { gitDetails } = require('git-er-done')

// Git commit ref / branch to check against. Default is 'master'
const GIT_COMMIT_REF = '9f63b23ec99e36a176d73909fc67a39dc3bd56b7'

gitDetails({
  base: GIT_COMMIT_REF,
}).then((git) => {
  /* git data returns
  {
    fileMatch: [Function], <-- Lookup function
    modifiedFiles: [ Array of modified files ],
    createdFiles: [ Array of created files ],
    deletedFiles: [ Array of deleted files ],
    commits: [ Array of commits ],
    lastCommit: { Object with last commit info },
    linesOfCode: [AsyncFunction: linesOfCode],
    dir: String path to git repo
  }
  */

  if (git.modifiedFiles.length) {
    // Some files have changed
  }

  if (git.createdFiles.length) {
    // Some files have been created
  }

  if (git.deletedFiles.length) {
    // Some files have been deleted
  }
})
```

### Using without options

You can call `gitDetails()` without any options to get info from the current HEAD:

```js
const { gitDetails } = require('git-er-done')

const git = await gitDetails()
console.log('Modified files:', git.modifiedFiles)
console.log('Created files:', git.createdFiles)
console.log('Deleted files:', git.deletedFiles)
```

### Getting Lines of Code Changed

```js
const { gitDetails } = require('git-er-done')

const git = await gitDetails({
  base: 'main',
  head: 'feature-branch'
})

const totalLines = await git.linesOfCode()
console.log(`Total lines changed: ${totalLines}`)
```

### Working with Commit Information

Access detailed commit information including author, committer, and subject:

```js
const { gitDetails } = require('git-er-done')

const git = await gitDetails({ base: 'main' })

// Access commits array
git.commits.forEach((commit) => {
  console.log('SHA:', commit.sha)
  console.log('Author:', commit.author.name, commit.author.email)
  console.log('Committer:', commit.committer.name)
  console.log('Subject:', commit.subject)
  console.log('Sanitized Subject:', commit.sanitizedSubject)
  console.log('---')
})

// Access the last commit
console.log('Last commit:', git.lastCommit)
```

### Using fileMatch with Patterns

Use glob patterns to match specific files. You can also use negation patterns:

```js
const { gitDetails } = require('git-er-done')

const git = await gitDetails({ base: 'main' })

// Simple pattern matching
const srcCode = git.fileMatch('src/**/*.js')
/* srcCode returns object with:
{
  modified: Boolean,
  modifiedFiles: Array,
  created: Boolean,
  createdFiles: Array,
  deleted: Boolean,
  deletedFiles: Array,
  edited: Boolean,
  editedFiles: Array
}
*/

if (srcCode.edited) {
  console.log('Source code has been edited')
  console.log('Modified files:', srcCode.modifiedFiles)
  console.log('Created files:', srcCode.createdFiles)
}

// Match with negation - find all JSON files except package.json
const jsonFiles = git.fileMatch('**/**.json', '!**/package.json')
if (jsonFiles.modified) {
  console.log('Non-package JSON files modified:', jsonFiles.modifiedFiles)
}
if (jsonFiles.created) {
  console.log('Non-package JSON files created:', jsonFiles.createdFiles)
}

// Check markdown files
const mdFiles = git.fileMatch('**/*.md')
if (mdFiles.edited) {
  // Do stuff because markdown files are changed
  console.log('All markdown changes:', mdFiles.editedFiles)
}
```

### Getting Detailed File Information

The `fileMatch` function returns detailed information about matched files:

```js
const { gitDetails } = require('git-er-done')

const git = await gitDetails({ base: 'main' })

const testFiles = git.fileMatch('**/*.test.js')

// Access individual arrays
console.log('Modified test files:', testFiles.modifiedFiles)
console.log('Created test files:', testFiles.createdFiles)
console.log('Deleted test files:', testFiles.deletedFiles)
console.log('All edited test files:', testFiles.editedFiles)

// Check if any test files changed
if (testFiles.edited) {
  console.log('Tests have been modified - run test suite')
}

## Prior art

This was originally found in [danger.js](https://danger.systems/js/) and extracted into this utility

- [@netlify/build](https://github.com/netlify/build/tree/master/packages/git-utils)
- [run-if-diff CLI](https://github.com/jameslnewell/run-if-diff)
