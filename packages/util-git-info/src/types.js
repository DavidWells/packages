/**
 * @typedef {Object} AuthorInfo
 * @property {string} name - Author's name
 * @property {string} email - Author's email address
 * @property {number} date - Unix timestamp of the commit date
 */

/**
 * @typedef {Object} CommitterInfo
 * @property {string} name - Committer's name
 * @property {string} email - Committer's email address
 * @property {number} date - Unix timestamp of the commit date
 */

/**
 * @typedef {Object} CommitInfo
 * @property {string} sha - Full commit SHA hash
 * @property {string} shortSha - Short commit SHA hash (7 characters)
 * @property {string} subject - Commit message subject line
 * @property {string} sanitizedSubject - Sanitized commit subject (suitable for file names)
 * @property {string} body - Full commit message body
 * @property {AuthorInfo} author - Commit author information
 * @property {CommitterInfo} committer - Commit committer information
 * @property {string} branch - Branch name
 * @property {string[]} tags - Tags associated with the commit
 */

/**
 * @typedef {Object} FileMatchResult
 * @property {boolean} modified - Whether any files matching the pattern were modified
 * @property {string[]} modifiedFiles - Array of modified files matching the pattern
 * @property {boolean} created - Whether any files matching the pattern were created
 * @property {string[]} createdFiles - Array of created files matching the pattern
 * @property {boolean} deleted - Whether any files matching the pattern were deleted
 * @property {string[]} deletedFiles - Array of deleted files matching the pattern
 * @property {boolean} edited - Whether any files matching the pattern were modified or created
 * @property {string[]} editedFiles - Array of modified and created files matching the pattern
 */

/**
 * @typedef {Object} GitDetails
 * @property {function(string, string=): FileMatchResult} fileMatch - Function to match files by glob pattern (supports negation patterns)
 * @property {string[]} modifiedFiles - Array of modified file paths
 * @property {string[]} createdFiles - Array of created file paths
 * @property {string[]} deletedFiles - Array of deleted file paths
 * @property {CommitInfo[]} commits - Array of commits between base and head
 * @property {string} lastCommit - SHA of the last commit
 * @property {string} dir - Path to the git repository
 * @property {function(): Promise<number>} linesOfCode - Async function that returns total lines of code changed
 */

module.exports = {}
