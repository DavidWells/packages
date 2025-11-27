#!/usr/bin/env node

const { checkDiff } = require('../src/git/diff/checkDiff')
const { parseArgs } = require('../src/cli/parseArgs')
const { spawn } = require('child_process')

/**
 * run-if-diff CLI
 * Runs a command only if files have changed
 *
 * Usage:
 *   run-if-diff [options] -- <command> [args...]
 *
 * Options:
 *   --since <ref>          Git reference to compare against (default: HEAD)
 *   --file-path <glob>     Glob pattern to filter files
 *   --file-status <status> Filter by status (added, modified, deleted)
 *   --help                 Show help
 *
 * Examples:
 *   run-if-diff --since main -- npm test
 *   run-if-diff --since HEAD~1 --file-path "src/**\/*.js" -- npm run build
 *   run-if-diff --file-status modified -- echo "Files were modified"
 */

/**
 * Execute a command by spawning a child process
 * @param {string} command - Command to execute
 * @param {string[]} args - Command arguments
 * @returns {Promise<number>} Promise that resolves to exit code
 */
function executeCommand(command, args = []) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true
    })

    child.on('error', (error) => {
      reject(error)
    })

    child.on('close', (code) => {
      resolve(code || 0)
    })
  })
}

async function main() {
  try {
    const argv = process.argv.slice(2)

    // Find the -- separator
    const separatorIndex = argv.indexOf('--')

    let options = {}
    let command = []

    if (separatorIndex === -1) {
      // No separator, treat everything as options or show help
      const args = parseArgs(argv, {
        boolean: ['help'],
        string: ['since', 'file-path', 'file-status'],
        alias: {
          h: 'help'
        }
      })

      if (args.help || args._.length === 0) {
        console.log(`
run-if-diff - Run a command only if files have changed

Usage:
  run-if-diff [options] -- <command> [args...]

Options:
  --since <ref>          Git reference to compare against (default: HEAD)
  --file-path <glob>     Glob pattern to filter files
  --file-status <status> Filter by status (added, modified, deleted)
  --help, -h             Show help

Examples:
  run-if-diff --since main -- npm test
  run-if-diff --since HEAD~1 --file-path "src/**/*.js" -- npm run build
  run-if-diff --file-status modified -- echo "Files were modified"
        `.trim())
        process.exit(0)
      }

      // If no separator but has arguments, treat remaining as command
      command = args._
    } else {
      // Parse options before separator
      const optionArgs = argv.slice(0, separatorIndex)
      const args = parseArgs(optionArgs, {
        boolean: ['help'],
        string: ['since', 'file-path', 'file-status'],
        alias: {
          h: 'help'
        }
      })

      if (args.help) {
        console.log(`
run-if-diff - Run a command only if files have changed

Usage:
  run-if-diff [options] -- <command> [args...]

Options:
  --since <ref>          Git reference to compare against (default: HEAD)
  --file-path <glob>     Glob pattern to filter files
  --file-status <status> Filter by status (added, modified, deleted)
  --help, -h             Show help

Examples:
  run-if-diff --since main -- npm test
  run-if-diff --since HEAD~1 --file-path "src/**/*.js" -- npm run build
  run-if-diff --file-status modified -- echo "Files were modified"
        `.trim())
        process.exit(0)
      }

      options = {
        since: args.since,
        filePath: args['file-path'],
        fileStatus: args['file-status']
      }

      // Everything after separator is the command
      command = argv.slice(separatorIndex + 1)
    }

    if (command.length === 0) {
      console.error('Error: No command specified')
      console.error('Usage: run-if-diff [options] -- <command> [args...]')
      process.exit(1)
    }

    // Check for differences
    const result = await checkDiff(options)

    if (result.count === 0) {
      // No changes, skip command execution
      console.log('No changes detected, skipping command execution')
      process.exit(0)
    }

    console.log(`${result.count} file(s) changed, executing command...`)

    // Execute the command
    const [cmd, ...cmdArgs] = command
    const exitCode = await executeCommand(cmd, cmdArgs)

    process.exit(exitCode)
  } catch (error) {
    console.error('Error:', error.message)
    process.exit(1)
  }
}

main()
