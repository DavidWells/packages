


const GIT_MAIN_BRANCH = 'main'

/**
 * Check if a URL is relative, i.e. does not start with a protocol
 * @type {RegExp}
 */
const RELATIVE_URL_REGEX = /^(?!www\.|(?:http|ftp)s?:\/\/|[A-Za-z]:\|\/\/).*/i


/**
 * @param {string} gitRepoUrl
 * @returns {string}
 */
function parseRepoName(gitRepoUrl) {
  // Handling for SSH URLs
  const normalizedUrl = gitRepoUrl.includes('git@')
    ? gitRepoUrl.replace(':', '/').replace('git@', 'https://')
    : gitRepoUrl
  const parsedRepoUrl = new URL(normalizedUrl)
  const cleanedPath = parsedRepoUrl.pathname.replace('.git', '')
  // Do not use the initial slash in the path
  const path = cleanedPath.substring(1)
  // Can't use "path" on it's own as Bitbucket adds irrelevant path suffix to the end of it
  return path.split('/').slice(0, 2).join('/')
}

/**
 * Generates URLs for RAW content such as images
 * @param {string} gitRepoUrl
 * @param {string} gitBranchName
 * @returns {string|undefined}
 */
function generateRawGitRepoUrlPrefix(gitRepoUrl, gitBranchName) {
  let urlPrefix
  const repoFullName = parseRepoName(gitRepoUrl)

  // Avoid errors created by missing branch name / badly formed URLs
  const branchName = gitBranchName || GIT_MAIN_BRANCH

  if (gitRepoUrl.includes('github.com')) {
    urlPrefix = `https://raw.githubusercontent.com/${repoFullName}/${branchName}`
  } else if (gitRepoUrl.includes('gitlab.com')) {
    urlPrefix = `https://gitlab.com/${repoFullName}/-/raw/${branchName}`
  } else if (gitRepoUrl.includes('bitbucket.org')) {
    // Note: bytebucket is a raw content serving service by Bitbucket
    urlPrefix = `https://bytebucket.org/${repoFullName}/raw/${branchName}`
  }

  return urlPrefix
}

/**
 * Generates URLs for files and folders
 * @param {string} gitRepoUrl
 * @param {string} gitBranchName
 * @param {string} href
 * @returns {string|undefined}
 */
function generateGitRepoUrlPrefix(gitRepoUrl, gitBranchName, href) {
  let urlPrefix
  const repoFullName = parseRepoName(gitRepoUrl)

  const hrefParts = href.split('/')
  const lastHrefPart = hrefParts[hrefParts.length - 1]

  // If the last part of the URL has a dot, it's a file with an extension or .gitignore (blob),
  // otherwise we assume the link is for a directory (tree)
  const isTreeOrBlob = lastHrefPart.includes('.') ? 'blob' : 'tree'

  // Avoid errors created by missing branch name / badly formed URLs
  const branchName = gitBranchName || GIT_MAIN_BRANCH

  if (gitRepoUrl.includes('github.com')) {
    urlPrefix = `https://github.com/${repoFullName}/${isTreeOrBlob}/${branchName}`
  } else if (gitRepoUrl.includes('gitlab.com')) {
    urlPrefix = `https://gitlab.com/${repoFullName}/-/${isTreeOrBlob}/${branchName}`
  } else if (gitRepoUrl.includes('bitbucket.org')) {
    // Note: bytebucket is a raw content serving service by Bitbucket
    urlPrefix = `https://bitbucket.org/${repoFullName}/src/${branchName}`
  }

  return urlPrefix
}

/**
 * Perform a Regex test on a given URL to see if it is relative.
 * @param {string} url
 * @returns {boolean}
 */
function isUrlRelative(url) {
  return RELATIVE_URL_REGEX.test(url)
}

// Parse a repo name from a URL
const githubRepoUrl = 'https://github.com/username/repo-name.git'
const sshRepoUrl = 'git@github.com:username/repo-name.git'
console.log(parseRepoName(githubRepoUrl)) // 'username/repo-name'
console.log(parseRepoName(sshRepoUrl)) // 'username/repo-name'

// Generate raw content URL
const rawUrl = generateRawGitRepoUrlPrefix('https://github.com/username/repo-name', 'master')
console.log(rawUrl) // 'https://raw.githubusercontent.com/username/repo-name/main'

// Generate file/folder URL
const postfix = 'src/index.js'
const fileUrl = generateGitRepoUrlPrefix('https://github.com/davidwells/stars', 'master', postfix)
console.log('fileUrl', fileUrl + '/' + postfix) // 'https://github.com/username/repo-name/blob/main'

// Check if URL is relative
console.log(isUrlRelative('/path/to/file')) // true
console.log(isUrlRelative('https://example.com')) // false
