# Using Git Info in CI/CD

## Quick Start

The `ci-detect-changed-packages.js` script automatically detects whether it's running in a PR or push context and adjusts accordingly.

```bash
node packages/util-git-info/examples/ci-detect-changed-packages.js
```

## GitHub Actions

### Environment Variables Used

The script reads these GitHub Actions environment variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `GITHUB_EVENT_NAME` | Event type | `pull_request` or `push` |
| `GITHUB_BASE_REF` | PR base branch | `master` |
| `GITHUB_HEAD_REF` | PR head branch | `feature-branch` |
| `GITHUB_SHA` | Current commit SHA | `abc123...` |
| `GITHUB_EVENT_BEFORE` | Previous commit SHA | `def456...` |
| `GITHUB_OUTPUT` | Path to output file | `/tmp/outputs` |

### Scenario 1: Pull Request

```yaml
on:
  pull_request:
    branches: [master]

jobs:
  test:
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Important: fetch full history

      - name: Detect changes
        run: node packages/util-git-info/examples/ci-detect-changed-packages.js
```

**What it compares:** `origin/master...HEAD` (your PR branch vs master)

### Scenario 2: Push to Master

```yaml
on:
  push:
    branches: [master]

jobs:
  test:
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Detect changes
        run: node packages/util-git-info/examples/ci-detect-changed-packages.js
```

**What it compares:** `$GITHUB_EVENT_BEFORE...$GITHUB_SHA` (previous commit vs current commit)

### Using the Output

The script sets GitHub Actions outputs that you can use in subsequent jobs:

```yaml
- name: Detect changed packages
  id: detect
  run: node packages/util-git-info/examples/ci-detect-changed-packages.js

- name: Use outputs
  run: |
    echo "Changed packages: ${{ steps.detect.outputs.packages }}"
    echo "Count: ${{ steps.detect.outputs.count }}"

# Run tests only for changed packages using matrix
- name: Test
  strategy:
    matrix:
      package: ${{ fromJson(steps.detect.outputs.json) }}
  run: npm test --workspace=${{ matrix.package }}
```

## Manual Comparison in CI

If you need more control, use the `gitDetails` API directly:

```javascript
const { gitDetails } = require('util-git-info')

// PR context: Compare branches
const git = await gitDetails({
  base: process.env.GITHUB_BASE_REF || 'master',
  head: 'HEAD'
})

// Push context: Compare commits
const git = await gitDetails({
  base: process.env.GITHUB_EVENT_BEFORE,
  head: process.env.GITHUB_SHA
})

// Check specific packages
if (git.fileMatch('packages/frontend/**').modified) {
  console.log('Frontend changed - run frontend tests')
}
```

## Common Patterns

### Skip CI if no packages changed

```yaml
- name: Detect changes
  id: detect
  run: node packages/util-git-info/examples/ci-detect-changed-packages.js

- name: Run tests
  if: steps.detect.outputs.count > 0
  run: npm test
```

### Run different jobs per package

```yaml
jobs:
  detect:
    outputs:
      packages: ${{ steps.detect.outputs.packages }}
    steps:
      - id: detect
        run: node packages/util-git-info/examples/ci-detect-changed-packages.js

  test-frontend:
    needs: detect
    if: contains(needs.detect.outputs.packages, 'frontend')
    run: npm test --workspace=frontend

  test-backend:
    needs: detect
    if: contains(needs.detect.outputs.packages, 'backend')
    run: npm test --workspace=backend
```

### Publish only changed packages

```yaml
- name: Detect changes
  id: detect
  run: node packages/util-git-info/examples/ci-detect-changed-packages.js

- name: Publish changed packages
  run: |
    for pkg in $(echo "${{ steps.detect.outputs.packages }}" | tr ',' ' '); do
      echo "Publishing $pkg"
      npm publish --workspace=$pkg
    done
```

## Important Notes

1. **Always use `fetch-depth: 0`** in GitHub Actions checkout to get full git history
2. **For PRs**, the script compares your branch against the base branch (usually master)
3. **For pushes**, it compares the current commit against the previous commit
4. **The script exits with code 0** even if no packages changed (use outputs to check)
5. **Outputs are comma-separated** strings - use `tr ',' ' '` or `fromJson()` to iterate

## Troubleshooting

### "fatal: ambiguous argument 'origin/master'"

Your CI doesn't have the base branch. Add this before running the script:

```bash
git fetch origin master:master
```

### No changes detected in PR

Make sure you're fetching enough history:

```yaml
- uses: actions/checkout@v4
  with:
    fetch-depth: 0  # This is required!
```

### Script fails with "not a git repository"

Ensure you've checked out the code first:

```yaml
- uses: actions/checkout@v4
```
