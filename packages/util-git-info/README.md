# Git Er Done

Utility for dealing with modified, created, deleted files since a git commit.

![image](https://user-images.githubusercontent.com/532272/70579463-909bd500-1b65-11ea-926f-bc31cb500ec7.png)

## Install

```bash
npm install git-er-done
```

## Features

- **Programmatic API** - Check for file changes, get commit info, and more
- **CLI Tools** - `exit-if-diff` and `run-if-diff` for conditional execution
- **Flexible Filtering** - Filter by file patterns and change types
- **CI/CD Ready** - Perfect for monorepo deployments and conditional workflows

## CLI Tools

This package includes command-line utilities for conditional execution based on git changes:

```bash
# Exit with specific code if files changed
exit-if-diff --since main --file-path "src/**"

# Run command only if files changed
run-if-diff --since main --file-path "src/**" -- npm test
```

See [CLI.md](./CLI.md) for complete CLI documentation.

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

### Getting File Creation and Modification Dates

Get git timestamps for when files were created and last modified:

```js
const { getFileDates, getFileModifiedTimeStamp, getFileCreatedTimeStamp } = require('git-er-done')

// Get both dates efficiently (recommended)
const dates = await getFileDates('src/index.js')
console.log('Created:', dates.createdDate)
console.log('Modified:', dates.modifiedDate)
console.log('Created timestamp:', dates.created) // Unix timestamp in seconds
console.log('Modified timestamp:', dates.modified) // Unix timestamp in seconds

// Or get just modified date
const modifiedTimestamp = await getFileModifiedTimeStamp('README.md')
console.log('Last modified:', new Date(modifiedTimestamp * 1000))

// Or get just created date
const createdTimestamp = await getFileCreatedTimeStamp('README.md')
console.log('First committed:', new Date(createdTimestamp * 1000))

// Get dates for multiple files (pass an array)
const files = ['README.md', 'package.json', 'src/index.js']
const fileDates = await getFileDates(files)

for (const [file, info] of Object.entries(fileDates)) {
  if (!info.error) {
    console.log(`${file}: last modified ${info.modifiedDate.toISOString()}`)
  }
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
```

### Getting Git Root Directory

```js
const { getGitRoot } = require('git-er-done')

const root = await getGitRoot()
console.log('Git root:', root) // '/Users/you/your-repo'
```

### Getting File Contents at a Specific Commit

Retrieve the contents of a file as it existed at a specific commit:

```js
const { getFileAtCommit } = require('git-er-done')

// Get file contents from previous commit
const previousVersion = await getFileAtCommit('src/index.js', 'HEAD~1')
console.log('Previous version:', previousVersion)

// Get file at specific SHA
const oldVersion = await getFileAtCommit('package.json', 'abc123')

// With cwd option for running in a different directory
const contents = await getFileAtCommit('src/app.js', 'main', {
  cwd: '/path/to/other/repo'
})
```

### Getting Git Remotes

```js
const { getRemotes, getRemote } = require('git-er-done')

// Get all remotes
const remotes = await getRemotes()
console.log('All remotes:', Object.keys(remotes)) // ['origin', 'upstream']
console.log('Origin URL:', remotes.origin.url)

// Get a specific remote
const origin = await getRemote('origin')
console.log('Origin:', origin)
// { name: 'origin', url: 'git@github.com:user/repo.git', fetchUrl: '...', pushUrl: '...' }
```

### Checking for Differences

Use `checkDiff` to programmatically check for file changes with filtering:

```js
const { checkDiff } = require('git-er-done')

// Check for any changes since a ref
const result = await checkDiff({ since: 'main' })
console.log(`${result.count} files changed`)
console.log('Added:', result.added)
console.log('Modified:', result.modified)
console.log('Deleted:', result.deleted)

// Filter by file path patterns
const jsChanges = await checkDiff({
  since: 'HEAD~5',
  filePath: '**/*.js'
})

// Filter by change type
const modifiedOnly = await checkDiff({
  since: 'main',
  fileStatus: 'modified'
})

// Combine filters
const srcChanges = await checkDiff({
  since: 'main',
  filePath: 'src/**/*.js',
  fileStatus: ['modified', 'added']
})

// Use in conditional logic
if (srcChanges.count > 0) {
  console.log('Source files changed, running build...')
  // Run build
}
```

### Subpath Exports

Import only what you need for smaller bundles:

```js
// Individual imports
const { getCommit } = require('git-er-done/get-commit')
const { getAllCommits } = require('git-er-done/get-all-commits')
const { getFirstCommit } = require('git-er-done/get-first-commit')
const { getLastCommit } = require('git-er-done/get-last-commit')
const { gitDetails } = require('git-er-done/get-details')
const { getGitRoot } = require('git-er-done/get-root')
const { getGitFiles } = require('git-er-done/get-files')
const { getFileAtCommit } = require('git-er-done/get-file-at-commit')
const { getFileDates, getFileModifiedTimeStamp, getFileCreatedTimeStamp } = require('git-er-done/get-file-dates')
const { getRemotes, getRemote } = require('git-er-done/get-remotes')
const { checkDiff } = require('git-er-done/check-diff')
```

## Examples

Check out the [`examples`](./examples) directory for more use cases:

### Basic Examples
- [`get-git-data.js`](./examples/get-git-data.js) - Get basic git information between commits
- [`get-all-commits.js`](./examples/get-all-commits.js) - Retrieve and display all commits
- [`get-git-files.js`](./examples/get-git-files.js) - Get list of all git-tracked files
- [`get-specific-commit-info.js`](./examples/get-specific-commit-info.js) - Get detailed information about a specific commit
- [`get-file-dates.js`](./examples/get-file-dates.js) - Get creation and modification dates for files

### File Change Detection
- [`detect-file-changes.js`](./examples/detect-file-changes.js) - Detect specific file changes between commits
- [`file-match-patterns.js`](./examples/file-match-patterns.js) - Comprehensive guide to file matching patterns
- [`check-diff.js`](./examples/check-diff.js) - Check for differences with filtering options

### Statistics & Analysis
- [`get-lines-of-code-changed.js`](./examples/get-lines-of-code-changed.js) - Calculate lines of code changed
- [`branch-comparison.js`](./examples/branch-comparison.js) - Compare two branches with detailed statistics

### Automation & CI/CD
- [`check-config-changes.js`](./examples/check-config-changes.js) - Detect configuration file changes for CI/CD pipelines
- [`code-review-helper.js`](./examples/code-review-helper.js) - Automated code review checklist and suggestions
- [`monorepo-package-detection.js`](./examples/monorepo-package-detection.js) - Detect which packages changed in a monorepo
- [`serverless-monorepo-detection.js`](./examples/serverless-monorepo-detection.js) - Detect changes in serverless projects within a monorepo
- [`generate-release-notes.js`](./examples/generate-release-notes.js) - Auto-generate release notes from commits

Run any example:

```bash
node examples/get-git-data.js
node examples/code-review-helper.js
node examples/monorepo-package-detection.js
node examples/serverless-monorepo-detection.js
```

## Prior art

This was originally found in [danger.js](https://danger.systems/js/) and extracted into this utility

- [@netlify/build](https://github.com/netlify/build/tree/master/packages/git-utils)
- [run-if-diff CLI](https://github.com/jameslnewell/run-if-diff)
