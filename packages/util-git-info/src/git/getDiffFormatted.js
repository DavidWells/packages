const path = require('path')
const { promisify } = require('util')
const { exec } = require('child_process')
const { getGitRoot } = require('./getGitRoot')
const terminalSize = require('./utils/term-size')
const execAsync = promisify(exec)

/**
 * Strip ANSI escape codes from a string
 */
function stripAnsi(str) {
  return str.replace(/\x1b\[[0-9;]*m/g, '')
}

/**
 * Calculate the longest line length in a diff
 */
function getLongestLineLength(diff) {
  const lines = diff.split('\n')
  let maxLength = 0

  for (const line of lines) {
    // Skip diff headers
    if (line.startsWith('diff --git') ||
        line.startsWith('index ') ||
        line.startsWith('---') ||
        line.startsWith('+++')) {
      continue
    }

    let contentToMeasure = line

    // For hunk headers (@@), extract the code context after the second @@
    if (line.startsWith('@@')) {
      const secondAtIndex = line.indexOf('@@', 2)
      if (secondAtIndex !== -1) {
        contentToMeasure = line.slice(secondAtIndex + 2)
      }
    } else {
      // Get actual content (skip the leading space/+/-)
      contentToMeasure = line.slice(1)
    }

    const cleanContent = stripAnsi(contentToMeasure)

    if (cleanContent.length > maxLength) {
      maxLength = cleanContent.length
    }
  }

  return maxLength
}

/**
 * Get formatted diff for a specific file
 * @param {Object} options - Options for getting formatted diff
 * @param {string} options.filePath - Relative path from git root
 * @param {string} options.gitRootDir - Absolute path to git root directory
 * @param {string} options.baseBranch - Base branch to compare against
 * @param {boolean} options.shrinkToLongestLine - Auto-calculate width based on longest line
 * @param {number} options.leftMargin - Number of spaces to add to the left of each line
 * @param {number} options.width - Width of the diff output (ignored if shrinkToLongestLine is true)
 * @param {boolean} options.hideHeader - Remove the file path header from the diff
 */
async function getFormattedDiff({
  filePath,
  gitRootDir,
  baseBranch = 'master',
  shrinkToLongestLine = false,
  leftMargin = 0,
  width = 140,
  hideHeader = false
}) {
  try {
    const { formatDiff } = await import('@davidwells/git-split-diffs')

    if (!gitRootDir) {
      gitRootDir = await getGitRoot()
    }

    // Get the diff for this specific file
    const { stdout: diff } = await execAsync(`git diff ${baseBranch} --ignore-cr-at-eol -- "${filePath}"`, {
      cwd: gitRootDir
    })

    if (!diff) {
      return null
    }

    // Calculate width if shrinkToLongestLine is enabled
    let diffWidth = width
    if (shrinkToLongestLine) {
      const longestLine = getLongestLineLength(diff)
      diffWidth = longestLine + 25
    }

    // TODO cache this value
    const terminalWidth = terminalSize()
    let maxWidth = Math.min(terminalWidth.columns, diffWidth)

    if (leftMargin > 0) {
      maxWidth = maxWidth - leftMargin
    }

    // Format the diff with git-split-diffs
    let formatted = await formatDiff(diff, {
      // hyperlinkFileNames: false,
      // hyperlinkLineNumbers: false,
      // hideFileHeader: true,
      // omitHunkHeaders: true,
      trimLastEmptyLine: true,
      width: maxWidth,
      minLineWidth: 80,
      wrapLines: false,
      highlightLineChanges: true,
      themeName: 'dark',
      gitRootDir,
    })

    // Remove header if hideHeader is true
    if (hideHeader) {
      const lines = formatted.split('\n')
      // Skip first 3 lines (separator, file path with ■■, separator)
      formatted = lines.slice(3).join('\n')
    }

    // Add left margin if specified
    if (leftMargin > 0) {
      const margin = ' '.repeat(leftMargin)
      return formatted.split('\n').map(line => margin + line).join('\n')
    }

    return formatted
  } catch (err) {
    console.error(`Error formatting diff for ${filePath}:`, err.message)
    return null
  }
}

module.exports = {
  getFormattedDiff
}
