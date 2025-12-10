const { gitDetails } = require('./git/getDetails')
const { getCommit } = require('./git/commits/getCommit')
const { getFirstCommit } = require('./git/commits/getFirstCommit')
const { getLastCommit } = require('./git/commits/getLastCommit')
const { getAllCommits } = require('./git/commits/getAllCommits')
const { getGitFiles } = require('./git/getGitFiles')
const { getGitRoot } = require('./git/getGitRoot')
const { getCurrentBranch } = require('./git/getCurrentBranch')
const { getRemotes, getRemote } = require('./git/remotes/getRemotes')
const { getFileAtCommit } = require('./git/getFileAtCommit')
const {
  getFileModifiedTimeStamp,
  getFileCreatedTimeStamp,
  getFileDates
} = require('./git/dates/getFileDates')

/**
 * @typedef {import('./types').AuthorInfo} AuthorInfo
 * @typedef {import('./types').CommitterInfo} CommitterInfo
 * @typedef {import('./types').CommitInfo} CommitInfo
 * @typedef {import('./types').FileMatchResult} FileMatchResult
 * @typedef {import('./types').GitDetails} GitDetails
 * @typedef {import('./types').FileDateInfo} FileDateInfo
 */

module.exports = {
  // Get Git Details
  gitDetails,
  getGitRoot,
  getCurrentBranch,
  // Get Commits
  getCommit,
  getAllCommits,
  getFirstCommit,
  getLastCommit,
  // Get Git Files
  getGitFiles,
  getFileAtCommit,
  // Get Git File time details
  getFileModifiedTimeStamp,
  getFileCreatedTimeStamp,
  getFileDates,
  // Get Git Remotes
  getRemotes,
  getRemote,
}
