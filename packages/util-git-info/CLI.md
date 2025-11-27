# CLI Tools

The `git-er-done` package includes command-line utilities for conditional execution based on git file changes.

## Installation

```bash
npm install git-er-done
```

The CLI tools will be available as `exit-if-diff` and `run-if-diff`.

## exit-if-diff

Exit with specific code based on whether files have changed.

### Usage

```bash
exit-if-diff [options]
```

### Options

- `--since <ref>` - Git reference to compare against (default: HEAD)
- `--file-path <glob>` - Glob pattern to filter files
- `--file-status <status>` - Filter by status (added, modified, deleted)
- `--exit-code-when-changed <code>` - Exit code when files changed (default: 128)
- `--exit-code-when-unchanged <code>` - Exit code when no changes (default: 0)
- `--help`, `-h` - Show help

### Examples

```bash
# Check for changes since main branch
exit-if-diff --since main

# Check for changes to JavaScript files
exit-if-diff --since HEAD~1 --file-path "src/**/*.js"

# Exit with code 1 when files are modified
exit-if-diff --file-status modified --exit-code-when-changed 1

# Use in shell scripts
if exit-if-diff --since main --file-path "src/**"; then
  echo "Source files changed"
else
  echo "No changes to source files"
fi
```

### Use Cases

#### CI/CD Pipelines

```yaml
# GitHub Actions example
- name: Check for config changes
  id: config_check
  run: exit-if-diff --since ${{ github.event.before }} --file-path "config/**"
  continue-on-error: true

- name: Deploy config
  if: steps.config_check.outcome == 'failure'
  run: npm run deploy:config
```

#### Shell Scripts

```bash
#!/bin/bash

# Only run tests if test files changed
if exit-if-diff --since origin/main --file-path "**/*.test.js"; then
  echo "Test files changed, running tests..."
  npm test
else
  echo "No test files changed, skipping tests"
fi
```

## run-if-diff

Run a command only if files have changed.

### Usage

```bash
run-if-diff [options] -- <command> [args...]
```

### Options

- `--since <ref>` - Git reference to compare against (default: HEAD)
- `--file-path <glob>` - Glob pattern to filter files
- `--file-status <status>` - Filter by status (added, modified, deleted)
- `--help`, `-h` - Show help

### Examples

```bash
# Run tests only if source files changed
run-if-diff --since main --file-path "src/**/*.js" -- npm test

# Run build only if files were modified (not just added)
run-if-diff --since HEAD~1 --file-status modified -- npm run build

# Run deployment script if config changed
run-if-diff --since origin/main --file-path "config/**" -- ./deploy.sh

# Run multiple commands
run-if-diff --since main -- bash -c "npm run build && npm run deploy"
```

### Use Cases

#### Monorepo CI/CD

```bash
#!/bin/bash

# Only build and test packages that changed
run-if-diff --since origin/main --file-path "packages/api/**" -- \
  npm run build --workspace=api && npm test --workspace=api

run-if-diff --since origin/main --file-path "packages/frontend/**" -- \
  npm run build --workspace=frontend && npm test --workspace=frontend
```

#### Conditional Deployments

```bash
#!/bin/bash

# Deploy different services based on what changed
run-if-diff --since $PREVIOUS_DEPLOY --file-path "services/auth/**" -- \
  ./deploy-auth.sh

run-if-diff --since $PREVIOUS_DEPLOY --file-path "services/api/**" -- \
  ./deploy-api.sh
```

#### Performance Optimization

```bash
#!/bin/bash

# Skip expensive operations if nothing changed
run-if-diff --since HEAD~1 --file-path "**/*.ts" -- npm run type-check
run-if-diff --since HEAD~1 --file-path "**/*.{js,ts}" -- npm run lint
```

## Programmatic API

You can also use the `checkDiff` function programmatically:

```javascript
const { checkDiff } = require('git-er-done')

async function main() {
  // Check for changes
  const result = await checkDiff({
    since: 'main',
    filePath: 'src/**/*.js',
    fileStatus: ['modified', 'added']
  })

  console.log(`${result.count} files changed`)
  console.log('Added:', result.added)
  console.log('Modified:', result.modified)
  console.log('Deleted:', result.deleted)

  if (result.count > 0) {
    // Do something
  }
}

main()
```

### API Options

```typescript
interface DiffOptions {
  since?: string          // Git reference (default: 'HEAD')
  filePath?: string | string[]  // Glob pattern(s) to filter files
  fileStatus?: string | string[] // Filter by status ('added', 'modified', 'deleted')
  cwd?: string           // Working directory
}

interface DiffResult {
  count: number          // Number of files that changed
  files: string[]        // List of all changed files
  added: string[]        // List of added files
  modified: string[]     // List of modified files
  deleted: string[]      // List of deleted files
}
```

## GitHub Actions Integration

You can use these CLI tools in GitHub Actions to conditionally run steps:

```yaml
name: Conditional CI

on: [push]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0  # Important: fetch full history

      - name: Install dependencies
        run: npm install

      - name: Test if changed
        run: |
          npx run-if-diff --since origin/main --file-path "src/**" -- npm test

      - name: Build if changed
        run: |
          npx run-if-diff --since origin/main --file-path "src/**" -- npm run build

      - name: Deploy if changed
        run: |
          npx run-if-diff --since origin/main --file-path "src/**" -- npm run deploy
```

## Common Patterns

### Skip Unchanged Services in Monorepo

```bash
# In package.json scripts
{
  "scripts": {
    "test:api": "run-if-diff --since origin/main --file-path 'packages/api/**' -- npm test --workspace=api",
    "test:web": "run-if-diff --since origin/main --file-path 'packages/web/**' -- npm test --workspace=web"
  }
}
```

### Conditional Type Checking

```bash
# Only run type check if TypeScript files changed
run-if-diff --since HEAD~1 --file-path "**/*.ts" -- npm run type-check
```

### Smart Cache Invalidation

```bash
# Rebuild cache only if dependencies changed
run-if-diff --since origin/main --file-path "package-lock.json" -- npm run rebuild-cache
```

## Troubleshooting

### "Not a git repository"

Make sure you're running the command in a git repository. Use the `cwd` option if needed:

```javascript
checkDiff({ since: 'main', cwd: '/path/to/repo' })
```

### "Please double check ref is valid"

The git reference you're comparing against doesn't exist. Common issues:
- Branch doesn't exist locally (fetch it first)
- Typo in branch/commit name
- Using `origin/main` when remote branch isn't fetched

### No changes detected

If you expect changes but none are found:
- Check that your git reference is correct
- Verify your glob patterns match the files you expect
- Try without filters to see all changes
- Make sure changes are committed (uncommitted changes won't be detected)

## Related

- [git-er-done README](./README.md) - Main package documentation
- [Examples](./examples/) - More usage examples
