const path = require('path')
const fs = require('fs')
const util = require('util')
const { test } = require('uvu')
const assert = require('uvu/assert')
const { findHeadings, findLeadingHeading, removeLeadingHeading, findClosestParentHeading } = require('./find-headings')
const { treeBuild } = require('./toc')
const FILE_WITH_HEADERS = path.join(__dirname, '../fixtures/file-with-headings.md')

function read(filePath) {
  return fs.readFileSync(filePath, 'utf-8')
}

function deepLog(objOrLabel, logVal) {
  let obj = objOrLabel
  if (typeof objOrLabel === 'string') {
    obj = logVal
    console.log(objOrLabel)
  }
  console.log(util.inspect(obj, false, null, true))
}

test('find headers x', async () => {
  const contents = read(path.join(__dirname, '../fixtures/syntax.md'))
  const headers = findHeadings(contents, {
    includeHtmlHeaders: true
  })
  assert.equal(headers.length, 19)
})

test('find headers', async () => {
  const contents = read(FILE_WITH_HEADERS)
  const headers = findHeadings(contents)
  /*
  console.log('headers', headers)
  return
  /** */
  assert.equal(headers, [
    {
      text: 'Heading 1 with paragraph',
      match: '# Heading 1 with paragraph',
      level: 1,
      index: 81
    },
    {
      text: 'Heading 2 with paragraph 1 😃',
      match: '## Heading 2 with paragraph 1 😃',
      level: 2,
      index: 194
    },
    {
      text: 'Heading 2 with paragraph 2',
      match: '## Heading 2 with paragraph 2',
      level: 2,
      index: 585
    },
    {
      text: 'Nested Heading 3 with paragraph',
      match: '### Nested Heading 3 with paragraph',
      level: 3,
      index: 973
    },
    {
      text: 'Nested Heading 3 with paragraph 2',
      match: '### Nested Heading 3 with paragraph 2',
      level: 3,
      index: 1367
    },
    {
      text: 'Heading 2 with paragraph 3',
      match: '## Heading 2 with paragraph 3',
      level: 2,
      index: 1763
    },
    {
      text: 'Heading 2 with paragraph 4',
      match: '## Heading 2 with paragraph 4',
      level: 2,
      index: 2164
    },
    {
      text: 'Heading 2 with paragraph 5',
      match: '## Heading 2 with paragraph 5',
      level: 2,
      index: 2552
    },
    {
      text: 'Heading 2 with paragraph 6',
      match: '## Heading 2 with paragraph 6',
      level: 2,
      index: 2940
    },
    {
      text: 'Group 2 Heading 1 with paragraph',
      match: '# Group 2 Heading 1 with paragraph',
      level: 1,
      index: 3958
    },
    {
      text: 'Group 2 Heading 2 with paragraph 1',
      match: '## Group 2 Heading 2 with paragraph 1',
      level: 2,
      index: 4079
    },
    {
      text: 'Group 2 Heading 2 with paragraph 2',
      match: '## Group 2 Heading 2 with paragraph 2',
      level: 2,
      index: 4475
    },
    {
      text: 'This is a first level heading',
      match: '\n\nThis is a first level heading\n=============================',
      level: 1,
      index: 4875
    },
    {
      text: 'This is a second level heading',
      match: '\n\nThis is a second level heading\n------------------------------',
      level: 2,
      index: 5293
    },
    {
      text: 'This is a first level heading 2',
      match: '\n\nThis is a first level heading 2\n=================================',
      level: 1,
      index: 5713
    },
    {
      text: 'This is a second level heading 2',
      match: '\n\nThis is a second level heading 2\n----------------------------------',
      level: 2,
      index: 6137
    }
  ])
})

test('handles setext false positives', async () => {
    const contentsTwo = `
first level heading 1
=====================

Blah

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer vitae mauris arcu, eu pretium nisi.
False positive 2
------------------------------------------

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer vitae mauris arcu, eu pretium nisi.
False positive 1
=================================

### Heading 3

#### Heading 4

##### Heading 5

###### Heading 6
`
  const headersTwo = findHeadings(contentsTwo)
  /*
  console.log('headersTwo', headersTwo)
  /** */
  assert.equal(headersTwo, [
    {
      text: 'first level heading 1',
      match: '\nfirst level heading 1\n=====================',
      level: 1,
      index: 1
    },
    { text: 'Heading 3', match: '### Heading 3', level: 3, index: 367 },
    { text: 'Heading 4', match: '#### Heading 4', level: 4, index: 382 },
    { text: 'Heading 5', match: '##### Heading 5', level: 5, index: 398 },
    {
      text: 'Heading 6',
      match: '###### Heading 6',
      level: 6,
      index: 415
    }
  ])
})


test('Filters unwanted headings', async () => {
    const contentsTwo = `
first level heading 1
=====================

Blah

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer vitae mauris arcu, eu pretium nisi.
False positive 2
------------------------------------------

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer vitae mauris arcu, eu pretium nisi.
False positive 1
=================================

### Heading 3

#### Heading 4

##### Heading 5

###### Heading 6
`
  const headersTwo = findHeadings(contentsTwo, {
    filter: ({ text }) => {
      return text !== 'Heading 4'
    }
  })
  /*
  console.log('headersTwo', headersTwo)
  /** */
  assert.equal(headersTwo, [
    {
      text: 'first level heading 1',
      match: '\nfirst level heading 1\n=====================',
      level: 1,
      index: 1
    },
    { text: 'Heading 3', match: '### Heading 3', level: 3, index: 367 },
    { text: 'Heading 5', match: '##### Heading 5', level: 5, index: 398 },
    {
      text: 'Heading 6',
      match: '###### Heading 6',
      level: 6,
      index: 415
    }
  ], 'headersTwo')

  const headersThree = findHeadings(contentsTwo, {
    filter: ({ text }) => {
      return !text.match(/Heading/)
    }
  })
  /*
  console.log('headersTwo', headersTwo)
  /** */
  assert.equal(headersThree, [
    {
      text: 'first level heading 1',
      match: '\nfirst level heading 1\n=====================',
      level: 1,
      index: 1
    },
  ], 'headersThree')


  const headersFour = findHeadings(contentsTwo, {
    filter: ({ text }) => {
      return !text.match(/first/)
    }
  })
  assert.equal(headersFour, [
    { text: 'Heading 3', match: '### Heading 3', level: 3, index: 367 },
    { text: 'Heading 4', match: '#### Heading 4', level: 4, index: 382 },
    { text: 'Heading 5', match: '##### Heading 5', level: 5, index: 398 },
    {
      text: 'Heading 6',
      match: '###### Heading 6',
      level: 6,
      index: 415
    }
  ], 'headersFour')
})

test('handles conflicts', async () => {
  const contents = `
\`\`\`
This is a first level heading
=============================

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer vitae mauris arcu, eu pretium nisi. Praesent fringilla ornare ullamcorper. Pellentesque diam orci, sodales in blandit ut, placerat quis felis. Vestibulum at sem massa, in tempus nisi. Vivamus ut fermentum odio. Etiam porttitor faucibus volutpat. Vivamus vitae mi ligula, non hendrerit urna.

This is a second level heading
------------------------------

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer vitae mauris arcu, eu pretium nisi. Praesent fringilla ornare ullamcorper. Pellentesque diam orci, sodales in blandit ut, placerat quis felis. Vestibulum at sem massa, in tempus nisi. Vivamus ut fermentum odio. Etiam porttitor faucibus volutpat. Vivamus vitae mi ligula, non hendrerit urna.
\`\`\`


\`\`\`
# In code Block Heading 1

## In code Block Heading 2

### In code Block Heading 3

#### In code Block Heading 4

##### In code Block Heading 5

###### In code Block Heading 6
\`\`\`

<pre>
  <code>
# In code pre Heading 1

## In code pre Heading 2

### In code pre Heading 3

#### In code pre Heading 4

##### In code pre Heading 5

###### In code pre Heading 6
  </code>
</pre>

<pre>
  <code>
<h1>HTML code pre Heading 1</h1>

<h2>HTML code pre Heading 2</h2>

<h2>HTML code pre Heading 2</h2>
  </code>
</pre>

`
  const headers = findHeadings(contents)
  /*
  console.log('headers', headers)
  /** */
  assert.equal(headers, [])


    const contentsTwo = `
# Heading 1

## Heading 2

### Heading 3

#### Heading 4

##### Heading 5

###### Heading 6

\`\`\`
# In code Block Heading 1

## In code Block Heading 2

### In code Block Heading 3

#### In code Block Heading 4

##### In code Block Heading 5

###### In code Block Heading 6
\`\`\`

`
  const headersTwo = findHeadings(contentsTwo)
  /*
  console.log('headersTwo', headersTwo)
  /** */
  assert.equal(headersTwo, [
    { text: 'Heading 1', match: '# Heading 1', level: 1, index: 1 },
    { text: 'Heading 2', match: '## Heading 2', level: 2, index: 14 },
    { text: 'Heading 3', match: '### Heading 3', level: 3, index: 28 },
    { text: 'Heading 4', match: '#### Heading 4', level: 4, index: 43 },
    { text: 'Heading 5', match: '##### Heading 5', level: 5, index: 59 },
    { text: 'Heading 6', match: '###### Heading 6', level: 6, index: 76 }
  ])

})

function normalizeObject(obj) {
  const { index, children, ...rest } = obj
  if (children && children.length > 0) {
    rest.children = children.map(normalizeObject)
  }
  return rest
}

test('treeBuild', async () => {
  const contents = read(FILE_WITH_HEADERS)
  const toc = treeBuild(contents, { excludeIndex: true })
  const headerToc = toc.map(normalizeObject)
  /*
  deepLog('headerToc', headerToc)
  // console.log(typeof toc)
  // console.log(Array.isArray(toc))
  // console.log(toc)
  // process.exit(1)
  /** */
  assert.equal(Array.isArray(toc), true)

  assert.equal(headerToc, [
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
  /*
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
  /*
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

test('findLeadingHeading - markdown style', () => {
  const text = '# My Heading\nSome content'
  const result = findLeadingHeading(text)
  assert.equal(result.match, '# My Heading')
  assert.equal(result.level, 1)
})

test('findLeadingHeading - HTML style', () => {
  const text = '<h1>My Heading</h1>\nSome content'
  const result = findLeadingHeading(text)
  assert.equal(result.match, '<h1>My Heading</h1>')
  assert.equal(result.level, 1)
})

test('findLeadingHeading - setext style h1', () => {
  const text = 'My Heading\n=====\nSome content'
  const result = findLeadingHeading(text)
  assert.equal(result.match, 'My Heading\n=====')
  assert.equal(result.level, 1)
})

test('findLeadingHeading - setext style h2', () => {
  const text = `My Heading
-----

Some content
`
  const result = findLeadingHeading(text)
  assert.equal(result.match, 'My Heading\n-----')
  assert.equal(result.level, 2)
})

test('findLeadingHeading - no heading', () => {
  const text = 'Some content without heading'
  const result = findLeadingHeading(text)
  assert.equal(result.match, '')
})

test('findLeadingHeading - empty string', () => {
  const text = ''
  const result = findLeadingHeading(text)
  assert.equal(result.match, '')
})

test('removeLeadingHeading - markdown style', () => {
  const text = '# My Heading\nSome content'
  const result = removeLeadingHeading(text)
  assert.equal(result, 'Some content')
})

test('removeLeadingHeading - HTML style', () => {
  const text = '<h1>My Heading</h1>\nSome content'
  const result = removeLeadingHeading(text)
  assert.equal(result, 'Some content')
})

test('removeLeadingHeading - setext style h1', () => {
  const text = 'My Heading\n=====\nSome content'
  const result = removeLeadingHeading(text)
  assert.equal(result, 'Some content')
})

test('removeLeadingHeading - setext style h2', () => {
  const text = 'My Heading\n-----\nSome content'
  const result = removeLeadingHeading(text)
  assert.equal(result, 'Some content')
})

test('removeLeadingHeading - no heading', () => {
  const text = 'Some content without heading'
  const result = removeLeadingHeading(text)
  assert.equal(result, 'Some content without heading')
})

test('removeLeadingHeading - empty string', () => {
  const text = ''
  const result = removeLeadingHeading(text)
  assert.equal(result, '')
})

test('findClosestParentHeading - should find the closest parent heading for a given location', async () => {
  const contents = read(FILE_WITH_HEADERS)
  // console.log('contents', contents)
  // Test case 1: Location after a level 3 heading, should find the level 2 parent
  const location1 = 1000 // After "Nested Heading 3 with paragraph"
  const parent1 = findClosestParentHeading(contents, location1)
  assert.equal(parent1.text, 'Heading 2 with paragraph 2')
  assert.equal(parent1.level, 2)
})

test('findClosestParentHeading - should find the closest parent heading for a given location 2', async () => {
  const contents = read(FILE_WITH_HEADERS)
  // console.log('contents', contents)
  // Test case 2: Location after a level 2 heading, should find the level 1 parent
  const location2 = 600 // After "Heading 2 with paragraph 2"
  const parent2 = findClosestParentHeading(contents, location2)
  // console.log('parent2', parent2)
  assert.equal(parent2.text, 'Heading 1 with paragraph')
  assert.equal(parent2.level, 1, 'parent2.level')

  // Test case 3: Location at the beginning of the document, should return null
  const location3 = 0
  const parent3 = findClosestParentHeading(contents, location3)
  assert.equal(parent3, undefined)

  // Test case 4: Location after a level 1 heading, should return null (no parent)
  const location4 = 100 // After "Heading 1 with paragraph"
  const parent4 = findClosestParentHeading(contents, location4)
  assert.equal(parent4, undefined)

  // Test case 5: Location in the middle of a paragraph, should find the closest heading
  const location5 = 300 // In the middle of a paragraph
  const parent5 = findClosestParentHeading(contents, location5)
  assert.equal(parent5.text, 'Heading 2 with paragraph 1 😃')
  assert.equal(parent5.level, 2, 'parent5.level')
})

test('findClosestParentHeading - should work with HTML headings', async () => {
  const contents = `
# Markdown Heading 1

Some text here.

<h2>HTML Heading 2</h2>

More text here.

<h3>HTML Heading 3</h3>

Even more text here.
`

  // Test case 1: Location after HTML Heading 3, should find HTML Heading 2 as parent
  const location1 = contents.indexOf('Even more text here')
  const parent1 = findClosestParentHeading(contents, location1, { includeHtmlHeaders: true })
  assert.equal(parent1.text, 'HTML Heading 3')
  assert.equal(parent1.level, 3)

  // Test case 2: Location after HTML Heading 2, should find Markdown Heading 1 as parent
  const location2 = contents.indexOf('More text here')
  const parent2 = findClosestParentHeading(contents, location2, { includeHtmlHeaders: true })
  assert.equal(parent2.text, 'HTML Heading 2')
  assert.equal(parent2.level, 2)
})

test('findClosestParentHeading - should work with setext headings', async () => {
  const contents = `
# Markdown Heading 1

Some text here.

Setext Heading 2
===============

More text here.

Setext Heading 3
---------------

Even more text here.
`

  // Test case 1: Location after Setext Heading 3, should find Setext Heading 2 as parent
  const location1 = contents.indexOf('Even more text here')
  const parent1 = findClosestParentHeading(contents, location1)
  assert.equal(parent1.text, 'Setext Heading 3')
  assert.equal(parent1.level, 2)

  // Test case 2: Location after Setext Heading 2, should find Markdown Heading 1 as parent
  const location2 = contents.indexOf('More text here')
  const parent2 = findClosestParentHeading(contents, location2)
  assert.equal(parent2.text, 'Setext Heading 2')
  assert.equal(parent2.level, 1)
})

test.run()
