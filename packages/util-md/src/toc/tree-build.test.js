const fs = require('fs')
const path = require('path')
const { test } = require('uvu')
const assert = require('uvu/assert')
const { treeBuild, treeStringify } = require('./')
const FILE_WITH_HEADERS = path.join(__dirname, '../../fixtures/file-with-headings.md')
const { deepLog, removeIndexFromObj } = require('../_test-utils')
const { removeFrontmatter } = require('../find-frontmatter')

function read(filePath) {
  return fs.readFileSync(filePath, 'utf-8')
}

function _generateTocTree(str, opts = {}) {
  const toc = treeBuild(removeFrontmatter(str), opts)
  return toc.map(removeIndexFromObj)
}

test('treeBuild', async () => {
  const contents = read(FILE_WITH_HEADERS)
  const toc = _generateTocTree(contents, { excludeIndex: true })
  //*
  deepLog('toc', toc)
  // console.log(typeof toc)
  // console.log(Array.isArray(toc))
  // console.log(toc)
  // process.exit(1)
  /** */
  assert.equal(Array.isArray(toc), true)

  assert.equal(toc, [
    {
      level: 1,
      // index: 81,
      text: 'Heading 1 with paragraph',
      slug: 'heading-1-with-paragraph',
      match: '# Heading 1 with paragraph',
      children: [
        {
          level: 2,
          // index: 194,
          text: 'Heading 2 with paragraph 1 😃',
          slug: 'heading-2-with-paragraph-1',
          match: '## Heading 2 with paragraph 1 😃'
        },
        {
          level: 2,
          // index: 585,
          text: 'Heading 2 with paragraph 2',
          slug: 'heading-2-with-paragraph-2',
          match: '## Heading 2 with paragraph 2',
          children: [
            {
              level: 3,
              // index: 973,
              text: 'Nested Heading 3 with paragraph',
              slug: 'nested-heading-3-with-paragraph',
              match: '### Nested Heading 3 with paragraph'
            },
            {
              level: 3,
              // index: 1367,
              text: 'Nested Heading 3 with paragraph 2',
              slug: 'nested-heading-3-with-paragraph-2',
              match: '### Nested Heading 3 with paragraph 2'
            }
          ]
        },
        {
          level: 2,
          // index: 1763,
          text: 'Heading 2 with paragraph 3',
          slug: 'heading-2-with-paragraph-3',
          match: '## Heading 2 with paragraph 3'
        },
        {
          level: 2,
          // index: 2164,
          text: 'Heading 2 with paragraph 4',
          slug: 'heading-2-with-paragraph-4',
          match: '## Heading 2 with paragraph 4'
        },
        {
          level: 2,
          // index: 2552,
          text: 'Heading 2 with paragraph 5',
          slug: 'heading-2-with-paragraph-5',
          match: '## Heading 2 with paragraph 5'
        },
        {
          level: 2,
          // index: 2940,
          text: 'Heading 2 with paragraph 6',
          slug: 'heading-2-with-paragraph-6',
          match: '## Heading 2 with paragraph 6'
        }
      ]
    },
    {
      level: 1,
      // index: 3958,
      text: 'Group 2 Heading 1 with paragraph',
      slug: 'group-2-heading-1-with-paragraph',
      match: '# Group 2 Heading 1 with paragraph',
      children: [
        {
          level: 2,
          // index: 4079,
          text: 'Group 2 Heading 2 with paragraph 1',
          slug: 'group-2-heading-2-with-paragraph-1',
          match: '## Group 2 Heading 2 with paragraph 1'
        },
        {
          level: 2,
          // index: 4475,
          text: 'Group 2 Heading 2 with paragraph 2',
          slug: 'group-2-heading-2-with-paragraph-2',
          match: '## Group 2 Heading 2 with paragraph 2'
        }
      ]
    },
    {
      level: 1,
      // index: 4875,
      text: 'This is a first level heading',
      slug: 'this-is-a-first-level-heading',
      match: '\n\nThis is a first level heading\n=============================',
      children: [
        {
          level: 2,
          // index: 5293,
          text: 'This is a second level heading',
          slug: 'this-is-a-second-level-heading',
          match: '\n\nThis is a second level heading\n------------------------------'
        }
      ]
    },
    {
      level: 1,
      // index: 5713,
      text: 'This is a first level heading 2',
      slug: 'this-is-a-first-level-heading-2',
      match: '\n\nThis is a first level heading 2\n=================================',
      children: [
        {
          level: 2,
          // index: 6137,
          text: 'This is a second level heading 2',
          slug: 'this-is-a-second-level-heading-2',
          match: '\n' +
            '\n' +
            'This is a second level heading 2\n' +
            '----------------------------------'
        }
      ]
    },
    {
      level: 1,
      // index: 6571,
      text: 'HTML Heading 1',
      slug: 'html-heading-1',
      match: '<h1>HTML Heading 1</h1>',
      children: [
        {
          level: 2,
          // index: 6654,
          text: 'HTML Heading 2',
          slug: 'html-heading-2',
          match: '<h2>HTML Heading 2</h2>'
        },
        {
          level: 2,
          // index: 7036,
          text: 'HTML Heading 2',
          slug: 'html-heading-2-1',
          match: '<h2>HTML Heading 2</h2>'
        }
      ]
    }
  ])
})

test('treeBuild with removeTocItems trim h1 and children', async () => {
  const contents = read(FILE_WITH_HEADERS)
  const headerToc = treeBuild(contents, {
    excludeIndex: true,
    removeTocItems: (api) => {
      // console.log('api', api)
      const { text } = api
      return text.match(/This is a first level heading 2/)
    }
  })

  /*
  deepLog('headerToc', headerToc)
  /** */
  assert.equal(headerToc, [
    {
      level: 1,
      text: 'Heading 1 with paragraph',
      slug: 'heading-1-with-paragraph',
      match: '# Heading 1 with paragraph',
      children: [
        {
          level: 2,
          text: 'Heading 2 with paragraph 1 😃',
          slug: 'heading-2-with-paragraph-1',
          match: '## Heading 2 with paragraph 1 😃'
        },
        {
          level: 2,
          text: 'Heading 2 with paragraph 2',
          slug: 'heading-2-with-paragraph-2',
          match: '## Heading 2 with paragraph 2',
          children: [
            {
              level: 3,
              text: 'Nested Heading 3 with paragraph',
              slug: 'nested-heading-3-with-paragraph',
              match: '### Nested Heading 3 with paragraph'
            },
            {
              level: 3,
              text: 'Nested Heading 3 with paragraph 2',
              slug: 'nested-heading-3-with-paragraph-2',
              match: '### Nested Heading 3 with paragraph 2'
            }
          ]
        },
        {
          level: 2,
          text: 'Heading 2 with paragraph 3',
          slug: 'heading-2-with-paragraph-3',
          match: '## Heading 2 with paragraph 3'
        },
        {
          level: 2,
          text: 'Heading 2 with paragraph 4',
          slug: 'heading-2-with-paragraph-4',
          match: '## Heading 2 with paragraph 4'
        },
        {
          level: 2,
          text: 'Heading 2 with paragraph 5',
          slug: 'heading-2-with-paragraph-5',
          match: '## Heading 2 with paragraph 5'
        },
        {
          level: 2,
          text: 'Heading 2 with paragraph 6',
          slug: 'heading-2-with-paragraph-6',
          match: '## Heading 2 with paragraph 6'
        }
      ]
    },
    {
      level: 1,
      text: 'Group 2 Heading 1 with paragraph',
      slug: 'group-2-heading-1-with-paragraph',
      match: '# Group 2 Heading 1 with paragraph',
      children: [
        {
          level: 2,
          text: 'Group 2 Heading 2 with paragraph 1',
          slug: 'group-2-heading-2-with-paragraph-1',
          match: '## Group 2 Heading 2 with paragraph 1'
        },
        {
          level: 2,
          text: 'Group 2 Heading 2 with paragraph 2',
          slug: 'group-2-heading-2-with-paragraph-2',
          match: '## Group 2 Heading 2 with paragraph 2'
        }
      ]
    },
    {
      level: 1,
      text: 'This is a first level heading',
      slug: 'this-is-a-first-level-heading',
      match: '\n\nThis is a first level heading\n=============================',
      children: [
        {
          level: 2,
          text: 'This is a second level heading',
          slug: 'this-is-a-second-level-heading',
          match: '\n\nThis is a second level heading\n------------------------------'
        }
      ]
    },
    {
      level: 1,
      text: 'HTML Heading 1',
      slug: 'html-heading-1',
      match: '<h1>HTML Heading 1</h1>',
      children: [
        {
          level: 2,
          text: 'HTML Heading 2',
          slug: 'html-heading-2',
          match: '<h2>HTML Heading 2</h2>'
        },
        {
          level: 2,
          text: 'HTML Heading 2',
          slug: 'html-heading-2-1',
          match: '<h2>HTML Heading 2</h2>'
        }
      ]
    }
  ])
})


test('treeBuild with removeTocItems trim h2 and children', async () => {
  const contents = read(FILE_WITH_HEADERS)
  const headerToc = treeBuild(contents, {
    // excludeIndex: true,
    removeTocItems: ({ text }) => {
      return text.match(/^Heading 2 with paragraph 2/)
    }
  })
  //*
  deepLog('headerToc', headerToc)
  /** */
  assert.equal(headerToc, [
    {
      level: 1,
      index: 81,
      text: 'Heading 1 with paragraph',
      slug: 'heading-1-with-paragraph',
      match: '# Heading 1 with paragraph',
      children: [
        {
          level: 2,
          index: 194,
          text: 'Heading 2 with paragraph 1 😃',
          slug: 'heading-2-with-paragraph-1',
          match: '## Heading 2 with paragraph 1 😃'
        },
        {
          level: 2,
          index: 1763,
          text: 'Heading 2 with paragraph 3',
          slug: 'heading-2-with-paragraph-3',
          match: '## Heading 2 with paragraph 3'
        },
        {
          level: 2,
          index: 2164,
          text: 'Heading 2 with paragraph 4',
          slug: 'heading-2-with-paragraph-4',
          match: '## Heading 2 with paragraph 4'
        },
        {
          level: 2,
          index: 2552,
          text: 'Heading 2 with paragraph 5',
          slug: 'heading-2-with-paragraph-5',
          match: '## Heading 2 with paragraph 5'
        },
        {
          level: 2,
          index: 2940,
          text: 'Heading 2 with paragraph 6',
          slug: 'heading-2-with-paragraph-6',
          match: '## Heading 2 with paragraph 6'
        }
      ]
    },
    {
      level: 1,
      index: 3958,
      text: 'Group 2 Heading 1 with paragraph',
      slug: 'group-2-heading-1-with-paragraph',
      match: '# Group 2 Heading 1 with paragraph',
      children: [
        {
          level: 2,
          index: 4079,
          text: 'Group 2 Heading 2 with paragraph 1',
          slug: 'group-2-heading-2-with-paragraph-1',
          match: '## Group 2 Heading 2 with paragraph 1'
        },
        {
          level: 2,
          index: 4475,
          text: 'Group 2 Heading 2 with paragraph 2',
          slug: 'group-2-heading-2-with-paragraph-2',
          match: '## Group 2 Heading 2 with paragraph 2'
        }
      ]
    },
    {
      level: 1,
      index: 4875,
      text: 'This is a first level heading',
      slug: 'this-is-a-first-level-heading',
      match: '\n\nThis is a first level heading\n=============================',
      children: [
        {
          level: 2,
          index: 5293,
          text: 'This is a second level heading',
          slug: 'this-is-a-second-level-heading',
          match: '\n\nThis is a second level heading\n------------------------------'
        }
      ]
    },
    {
      level: 1,
      index: 5713,
      text: 'This is a first level heading 2',
      slug: 'this-is-a-first-level-heading-2',
      match: '\n\nThis is a first level heading 2\n=================================',
      children: [
        {
          level: 2,
          index: 6137,
          text: 'This is a second level heading 2',
          slug: 'this-is-a-second-level-heading-2',
          match: '\n' +
            '\n' +
            'This is a second level heading 2\n' +
            '----------------------------------'
        }
      ]
    },
    {
      level: 1,
      index: 6571,
      text: 'HTML Heading 1',
      slug: 'html-heading-1',
      match: '<h1>HTML Heading 1</h1>',
      children: [
        {
          level: 2,
          index: 6654,
          text: 'HTML Heading 2',
          slug: 'html-heading-2',
          match: '<h2>HTML Heading 2</h2>'
        },
        {
          level: 2,
          index: 7036,
          text: 'HTML Heading 2',
          slug: 'html-heading-2-1',
          match: '<h2>HTML Heading 2</h2>'
        }
      ]
    }
  ])
})

const headingWithFootnotes = `

## Headings with footnote[^footnote in heading] example

`

test('Heading with footnote', () => {
  const headerToc = treeBuild(headingWithFootnotes)
  //*
  deepLog('headerToc', headerToc)
  /** */
  assert.equal(headerToc, [
    {
      level: 2,
      text: 'Headings with footnote[^footnote in heading] example',
      slug: 'headings-with-footnotefootnote-in-heading-example',
      match: '## Headings with footnote[^footnote in heading] example',
      index: 0
    }
  ])
})

const multipleLayers = `
# Heading 1

stuff

## Heading 2

more stuff

### Heading 3

even more stuff

# 2nd Heading 1

stuff

## 2nd Heading 2

more stuff

### 2nd Heading 3

even more stuff
`

test('Generates Toc multipleLayers', () => {
  const toc = _generateTocTree(multipleLayers)

  deepLog(toc)
  assert.equal(toc, [
    {
      level: 1,
      text: 'Heading 1',
      slug: 'heading-1',
      match: '# Heading 1',
      children: [
        {
          level: 2,
          text: 'Heading 2',
          slug: 'heading-2',
          match: '## Heading 2',
          children: [
            {
              level: 3,
              text: 'Heading 3',
              slug: 'heading-3',
              match: '### Heading 3',
            },
          ],
        },
      ],
    },
    {
      level: 1,
      text: '2nd Heading 1',
      slug: '2nd-heading-1',
      match: '# 2nd Heading 1',
      children: [
        {
          level: 2,
          text: '2nd Heading 2',
          slug: '2nd-heading-2',
          match: '## 2nd Heading 2',
          children: [
            {
              level: 3,
              text: '2nd Heading 3',
              slug: '2nd-heading-3',
              match: '### 2nd Heading 3',
            },
          ],
        },
      ],
    },
  ])

  const tocText = treeStringify(toc)
  // console.log('tocText', tocText)

  assert.equal(tocText.text,
`
- [Heading 1](#heading-1)
  - [Heading 2](#heading-2)
    - [Heading 3](#heading-3)
- [2nd Heading 1](#2nd-heading-1)
  - [2nd Heading 2](#2nd-heading-2)
    - [2nd Heading 3](#2nd-heading-3)
`.trim(), 'tocText')

  const tocTextNoH1s = treeStringify(toc, { skipH1: true })
  // console.log('tocTextNoH1s', tocTextNoH1s)
  assert.equal(tocTextNoH1s.text,
`
- [Heading 2](#heading-2)
  - [Heading 3](#heading-3)
- [2nd Heading 2](#2nd-heading-2)
  - [2nd Heading 3](#2nd-heading-3)
`.trim(), 'tocTextNoH1s')

  const tocTextNoFirstH1 = treeStringify(toc, { stripFirstH1: true })
  // console.log('tocTextNoFirstH1', tocTextNoFirstH1)
  assert.equal(tocTextNoFirstH1.text,
`
- [Heading 2](#heading-2)
  - [Heading 3](#heading-3)
- [2nd Heading 1](#2nd-heading-1)
  - [2nd Heading 2](#2nd-heading-2)
    - [2nd Heading 3](#2nd-heading-3)
`.trim(), 'tocTextNoFirstH1')

  // Only show up to level 2
  const tocTextMaxDepth2 = treeStringify(toc, { maxDepth: 2 })
  // console.log('tocTextMaxDepth2', tocTextMaxDepth2)
  assert.equal(tocTextMaxDepth2.text,
`
- [Heading 1](#heading-1)
  - [Heading 2](#heading-2)
- [2nd Heading 1](#2nd-heading-1)
  - [2nd Heading 2](#2nd-heading-2)
`.trim(), 'tocTextMaxDepth2')

  // Only show first level
  const tocTextMaxDepth1 = treeStringify(toc, { maxDepth: 1 })
  // console.log('tocTextMaxDepth1', tocTextMaxDepth1)
  assert.equal(tocTextMaxDepth1.text,
`
- [Heading 1](#heading-1)
- [2nd Heading 1](#2nd-heading-1)
`.trim(), 'tocTextMaxDepth1')

  const tocTextNoFirstH1MaxDepth2 = treeStringify(toc, { stripFirstH1: true, maxDepth: 2 })
  // console.log('tocTextNoFirstH1MaxDepth2', tocTextNoFirstH1MaxDepth2)
  assert.equal(tocTextNoFirstH1MaxDepth2.text,
`
- [Heading 2](#heading-2)
  - [Heading 3](#heading-3)
- [2nd Heading 1](#2nd-heading-1)
  - [2nd Heading 2](#2nd-heading-2)
`.trim(), 'tocTextNoFirstH1MaxDepth2')

})

test.run()
