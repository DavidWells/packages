const { spawn } = require('child_process')
const { debug } = require('../debug')
const { removeSignedOffBy } = require('./commits/utils/pretty-format')

const d = debug('localGetDiff')
const sha = '%H'
const parents = '%p'
const authorName = '%an'
const authorEmail = '%ae'
const authorDate = '%aI'
const committerName = '%cn'
const committerEmail = '%ce'
const committerDate = '%cI'
const subject = '%s'
const message = '%f' // this is subject, not message, so it'll only be one line
const body = '%b'
const author = `"author": {"name": "${authorName}", "email": "${authorEmail}" }`
const committer = `"committer": {"name": "${committerName}", "email": "${committerEmail}" }`
const details = `"subject": "${subject}", "sanitizedSubject": "${message}", "body": "${body}"`
const dateInfo = `"authoredOn": "${authorDate}", "committedOn": "${committerDate}"`

const formatJSON = `{ "sha": "${sha}", "parents": "${parents}", ${author}, ${committer}, ${details}, ${dateInfo}},`
// console.log('formatJSON', formatJSON)
/*
  authoredOn: a[5],
  committedOn: a[6],
*/

/* Fields and records are split on ASCII unit/record separators, which never appear in
   commit metadata or messages, so no escaping is needed (the JSON-shaped format above is
   kept for formatJSON/attemptToFix callers). */
const FIELD = '\x1f'
const RECORD = '\x1e'
const FIELDS = [sha, parents, authorName, authorEmail, authorDate, committerName, committerEmail, committerDate, subject, message, body]
const formatRecords = FIELDS.join('%x1f') + '%x1e'

/**
 * Parse `git log --pretty=format:<formatRecords>` output
 * @param {string} output
 * @returns {Array<object>}
 */
function parseCommitRecords(output) {
  return output
    .split(RECORD)
    .map((record) => record.replace(/^\r?\n/, ''))
    .filter((record) => record.length > 0)
    .map((record) => {
      const f = record.split(FIELD)
      return {
        sha: f[0],
        parents: f[1] ? f[1].split(' ') : [],
        author: { name: f[2], email: f[3] },
        committer: { name: f[5], email: f[6] },
        subject: stripSignedOffBy(f[8] || ''),
        sanitizedSubject: f[9] || '',
        body: stripSignedOffBy(f[10] || ''),
        authoredOn: f[4],
        committedOn: f[7],
      }
    })
}

/** Remove "Signed-off-by: Name <email>" trailers (real newlines). */
function stripSignedOffBy(text) {
  return text.replace(/(\n)?Signed-off-by: (.*) <(.*)>(\n)?/gmi, '')
}

/**
 * Get commits between two refs
 * @param {string} base - Base ref
 * @param {string} head - Head ref
 * @param {string} [cwd] - Working directory (defaults to process.cwd())
 */
const localGetCommits = (base, head, cwd) => {
  return new Promise(resolve => {
    const args = ['log', `${base}...${head}`, `--pretty=format:${formatRecords}`]
    const child = spawn('git', args, { env: process.env, cwd: cwd || process.cwd() })
    // Buffer everything: a chunk can end mid-record, so parse only once git is done.
    const out = []
    let stdErr = ''
    d('> git', args.join(' '))
    child.stdout.on('data', (data) => { out.push(data) })
    child.stderr.on('data', (data) => { stdErr += data.toString() })
    child.on('close', (code) => {
      if (code === 0) return resolve(parseCommitRecords(Buffer.concat(out).toString('utf8')))
      console.error(`Could not get commits from git between ${base} and ${head}`)
      return resolve(stdErr)
    })
    child.on('error', (error) => {
      stdErr += error.toString()
      console.log(error.toString())
    })
  })
}

const FIX_SUBJECT = /("subject":)([\s\S]*?)*?("sanitizedSubject")/g
const FIX_BODY = /("body":)([\s\S]*?)*?("authoredOn")/g

function attemptToFix(jsonLikeValue) {
  const fixedSub = findAndFind(jsonLikeValue, FIX_SUBJECT)
  const fixedBody = findAndFind(fixedSub, FIX_BODY)
  return JSON.parse(`[${fixedBody}]`)
}

function findAndFind(str, pattern) {
  const x = getMatches(str, pattern)
  let newX = str
  for (let i = 0; i < x.length; i++) {
    newX = newX.replace(x[i].match, x[i].replacement)
  }
  return newX
}

function getMatches(str, myRegex) {
  var matches = []
  var match

  while (match = myRegex.exec(str)) { // eslint-disable-line
    const firstKey = match[1]
    const lastKey = match[3]
    // console.log('match[0]', match[0])

    const cleanSubject = match[0]
      .replace(match[1], '')
      .replace(match[3], '')
      // .replace(/,\n\s*$/, '')
      .replace(/(\r\n|\n|\r)/gm, '')
      .replace(/"/gm, '')
      .trim()
      .replace(/,$/gm, '')
    // console.log('cleanSubject', `"${cleanSubject}"`)
    if (cleanSubject) {
      matches.push({
        match: match[0],
        replacement: `${firstKey} "${removeSignedOffBy(cleanSubject)}",\n ${lastKey}`,
      })
    }

    if (myRegex.lastIndex === match.index) {
      myRegex.lastIndex++
    }
  }

  return matches
}

module.exports.formatJSON = formatJSON
module.exports.localGetCommits = localGetCommits
module.exports.attemptToFix = attemptToFix
module.exports.parseCommitRecords = parseCommitRecords
module.exports.formatRecords = formatRecords
