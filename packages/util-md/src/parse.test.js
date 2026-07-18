const fs = require('fs')
const path = require('path')
const util = require('util')
const { test } = require('uvu')
const assert = require('uvu/assert')
const { parseMarkdown } = require('./parse')
const { findLinks } = require('./find-links')
const { parseFrontmatter } = require('./frontmatter')

const DEEP_LOG = false

function deepLog(myObject, myObjectTwo) {
  // if (!DEEP_LOG) return
  let obj = myObject
  if (typeof myObject === 'string') {
    obj = myObjectTwo
    console.log(myObject)
  }
  console.log(util.inspect(obj, false, null, true /* enable colors */))
}

function read(filePath) {
  return fs.readFileSync(filePath, 'utf-8')
}

const FILE_PATH = path.join(__dirname, '../fixtures/file-with-links.md')
const BIG_POST = path.join(__dirname, '../fixtures/big-post.md')
const SNIPPET_POST = path.join(__dirname, '../fixtures/snippet.md')

// const FILE_PATH = path.join(__dirname, 'fixtures/2022-01-22-date-in-filename.md')
const fileContents = fs.readFileSync(FILE_PATH, 'utf-8')

test.skip('Should handle no frontmatter', async () => {
  const res = parseMarkdown(`
# heading 1

Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
`, { filePath: SNIPPET_POST })
  deepLog(res)
  assert.equal(res.links.length, 1)
})

test('Read snippet post', async () => {
  const res = parseMarkdown(read(SNIPPET_POST), { filePath: SNIPPET_POST })
  // deepLog(res)
  assert.equal(res.links.length, 1)
})

test('Read big post', async () => {
  const res = parseMarkdown(read(BIG_POST), { filePath: BIG_POST })
  // deepLog(res.links)
  assert.equal(res.links.length, 131)
})

test('parseMarkdown API', async () => {
  const res = parseMarkdown(fileContents, { filePath: FILE_PATH })

  assert.is(typeof res, 'object')
  assert.is(typeof res.ast, 'object')
  assert.is(typeof res.data, 'object')
  assert.is(typeof res.content, 'string')
  assert.is(typeof res.codeBlocks, 'object')
  assert.is(Array.isArray(res.codeBlocks), true)
  assert.is(typeof res.links, 'object')
  assert.is(typeof res.footnotes, 'object')
  assert.is(Array.isArray(res.footnotes), true)
  assert.is(Array.isArray(res.toc), true)
  assert.is(Array.isArray(res.errors), true)

  setTimeout(() => {
    console.log('parseMarkdown API values')
    console.log(Object.keys(res))
  }, 50)
})

test('parser verify contents', async () => {
  const res = parseMarkdown(fileContents, {
    filePath: FILE_PATH
  })
  // deepLog('Results:', res)
  // process.exit(1)
  assert.equal(res.links, [
    'https://funky-frontmatter.com',
    'https://www.front.com/blog/open-beta-changes',
    'https://youtu.be/A1bL4pHuivU',
    'https://foooooooooooo.com',
    'https://www.youtube.com/embed/KX7tj3giizI',
    'https://app.netlify.com/start/deploy',
    'https://www.yoursite.com/pricing?utm_source=active%20users&utm_medium=email&utm_campaign=feature%20launch&utm_content=bottom%20cta%20button',
    'https://ABC.com/sign-up',
    'http://jobs.ABC.net',
    '/foobar',
    'https://github.com/davidwells'
  ])
  assert.equal(res.images, [
    '/assets/images/lol-frontmatter.jpg',
    '/assets/images/lol.jpg',
    'assets/images/san-juan-mountains.jpg',
    'https://res.cloudinary.com/ABC/image/upload/f_auto,q_auto/c_fill,w_1200/v1668114635/what-you-can-build_p8uape.png',
    'https://avatars2.githubusercontent.com/u/532272?v=3&s=400',
    'https://dope-frontmatter.com/img/deploy/button.svg',
    'https://frontmatter.com/img/deploy/button.svg',
    '/img/in-nested-frontmatter/button.svg',
    'https://www.netlify.com/img/deploy/button.svg',
    'https://fooo.com/img/deploy/button.svg',
    '/img/deploy/button.svg',
    'img/deploy/button.svg',
    '../img/deploy/button.svg'
  ])
})

test('opts - includeAst false', async () => {
  const res = parseMarkdown(fileContents, {
    filePath: FILE_PATH,
  })
  // deepLog('Results:', res)
  assert.ok(Array.isArray(res.ast))
  /* Disable AST */
  const resTwo = parseMarkdown(fileContents, {
    filePath: FILE_PATH,
    includeAst: false,
  })
  // deepLog('Results two:', resTwo)
  assert.ok(typeof resTwo.ast === 'undefined')
})

test('opts - includeImages false', async () => {
  const res = parseMarkdown(fileContents, {
    filePath: FILE_PATH,
    // includeAst: false,
    includeImages: false,
  })
  // deepLog('Results:', res)
  assert.ok(typeof res.links === 'object')
  assert.ok(typeof res.images === 'undefined')
})

test('opts - includeLinks false', async () => {
  const res = parseMarkdown(fileContents, {
    filePath: FILE_PATH,
    includeLinks: false,
  })
  // deepLog('Results:', res)
  assert.ok(typeof res.links === 'undefined')
  assert.ok(typeof res.images === 'object')
})

// test('File have correct extensions', async () => {
//   const { data } = parseFrontmatter(fileWithLinks, FILE_PATH)
//   console.log('frontmatter data', data)
//   const links = findLinks(fileWithLinks, { frontmatter: data })
//   // console.log('links', links)
//   // console.log('FILE_PATH', FILE_PATH)
//   // console.log('parseMarkdown')
//   // const x = parseMarkdown(fileWithLinks, { filePath: FILE_PATH })
//   // deepLog(x)
// })

test('broken frontmatter falls back to raw content instead of undefined', () => {
  const md = '---\n**bold run not yaml\n---\n```ts\nconst a = 1\n```'
  const post = parseMarkdown(md, { filePath: 'x.md' })
  assert.type(post.content, 'string')
  assert.ok(post.content.includes('```ts'), 'content keeps body: ' + JSON.stringify(post.content))
  assert.ok(post.errors.length > 0, 'error recorded')
})

test.run()

