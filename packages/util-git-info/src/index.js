const { gitDetails } = require('./git/getDetails')
const { getCommit } = require('./git/commits/getCommit')
const { getFirstCommit } = require('./git/commits/getFirstCommit')
const { getLastCommit } = require('./git/commits/getLastCommit')
const { getAllCommits } = require('./git/commits/getAllCommits')
const { getGitFiles } = require('./git/getGitFiles')
const { getGitRoot } = require('./git/getGitRoot')
const { getRemotes, getRemote } = require('./git/remotes/getRemotes')
const { getFileAtCommit } = require('./git/getFileAtCommit')
const {
  getFileModifiedTimeStamp,
  getFileCreatedTimeStamp,
  getFileDates
} = require('./git/dates/getFileDates')

module.exports = {
  // Get Git Details
  gitDetails,
  getGitRoot,
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
