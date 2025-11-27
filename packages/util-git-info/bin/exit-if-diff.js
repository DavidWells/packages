#!/usr/bin/env node

const { checkDiff } = require('../src/git/diff/checkDiff')
const { parseArgs } = require('../src/cli/parseArgs')

/**
 * exit-if-diff CLI
 * Exits with specific code based on whether files have changed
 *
 * Usage:
 *   exit-if-diff [options]
 *
 * Options:
 *   --since <ref>                    Git reference to compare against (default: HEAD)
 *   --file-path <glob>               Glob pattern to filter files
 *   --file-status <status>           Filter by status (added, modified, deleted)
 *   --exit-code-when-changed <code>  Exit code when files changed (default: 128)
 *   --exit-code-when-unchanged <code> Exit code when no changes (default: 0)
 *   --help                           Show help
 *
 * Examples:
 *   exit-if-diff --since main
 *   exit-if-diff --since HEAD~1 --file-path "src/**\/*.js"
 *   exit-if-diff --file-status modified --exit-code-when-changed 1
 */

async function main() {
  try {
    const args = parseArgs(process.argv.slice(2), {
      boolean: ['help'],
      string: ['since', 'file-path', 'file-status', 'exit-code-when-changed', 'exit-code-when-unchanged'],
      alias: {
        h: 'help'
      }
    })

    if (args.help) {
      console.log(`
exit-if-diff - Exit with specific code based on file changes

Usage:
  exit-if-diff [options]

Options:
  --since <ref>                    Git reference to compare against (default: HEAD)
  --file-path <glob>               Glob pattern to filter files
  --file-status <status>           Filter by status (added, modified, deleted)
  --exit-code-when-changed <code>  Exit code when files changed (default: 128)
  --exit-code-when-unchanged <code> Exit code when no changes (default: 0)
  --help, -h                       Show help

Examples:
  exit-if-diff --since main
  exit-if-diff --since HEAD~1 --file-path "src/**/*.js"
  exit-if-diff --file-status modified --exit-code-when-changed 1
      `.trim())
      process.exit(0)
    }

    const exitCodeWhenChanged = parseInt(args['exit-code-when-changed'] || '128', 10)
    const exitCodeWhenUnchanged = parseInt(args['exit-code-when-unchanged'] || '0', 10)

    const options = {
      since: args.since,
      filePath: args['file-path'],
      fileStatus: args['file-status']
    }

    const result = await checkDiff(options)

    if (result.count > 0) {
      process.exit(exitCodeWhenChanged)
    } else {
      process.exit(exitCodeWhenUnchanged)
    }
  } catch (error) {
    console.error('Error:', error.message)
    process.exit(1)
  }
}

main()
