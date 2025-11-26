const { gitDetails } = require('./git/getDetails')
const { getCommit } = require('./git/commits/getCommit')
const { getFirstCommit } = require('./git/commits/getFirstCommit')
const { getLastCommit } = require('./git/commits/getLastCommit')
const { getAllCommits } = require('./git/commits/getAllCommits')
const { getGitFiles } = require('./git/getGitFiles')
const {
  getFileModifiedDate,
  getFileCreatedDate,
  getFileDates,
  getMultipleFileDates
} = require('./git/dates/getFileDates')

module.exports = {
  getCommit,
  getFirstCommit,
  getLastCommit,
  getAllCommits,
  gitDetails,
  getGitFiles,
  getFileModifiedDate,
  getFileCreatedDate,
  getFileDates,
  getMultipleFileDates
}
