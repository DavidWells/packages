const fs = require('fs')
const path = require('path')
const { test } = require('uvu')
const assert = require('uvu/assert')
const {
  generateToc,
  treeBuild,
  treeStringify,
  normalizeLevels,
} = require('./')
const { deepLog, clearIndexValues } = require('../_test-utils')

const FIXTURES_PATH = path.resolve(__dirname, '../../fixtures')

const largeTable = fs.readFileSync(`${FIXTURES_PATH}/large-table.md`, 'utf8')

test('Generates Toc largeTable and skip all h1s', () => {
  const toc = generateToc(largeTable, { skipH1: true })

  deepLog(toc)

  assert.equal(toc.text,
`
- [Stars by date](#stars-by-date)
- [About this repo](#about-this-repo)
  - [Features](#features)
  - [Usage](#usage)
  - [Props](#props)
`.trim(), 'toc')

  const tocItems = clearIndexValues(toc.tocItems)
  assert.equal(tocItems,
  [
    {
      level: 2,
      text: 'Stars by date',
      slug: 'stars-by-date',
      match: '## Stars by date'
    },
    {
      level: 2,
      text: 'About this repo',
      slug: 'about-this-repo',
      match: '## About this repo',
      children: [
        {
          level: 3,
          text: 'Features',
          slug: 'features',
          match: '### Features'
        },
        { level: 3, text: 'Usage', slug: 'usage', match: '### Usage' },
        { level: 3, text: 'Props', slug: 'props', match: '### Props' }
      ]
    }
  ])
  // normalize levels
  const normalizedTocItems = normalizeLevels(tocItems, 1)
  deepLog(normalizedTocItems)
  assert.equal(normalizedTocItems,
  [
    {
      level: 1,
      text: 'Stars by date',
      slug: 'stars-by-date',
      match: '## Stars by date',
      originalLevel: 2
    },
    {
      level: 1,
      text: 'About this repo',
      slug: 'about-this-repo',
      match: '## About this repo',
      children: [
        {
          level: 2,
          text: 'Features',
          slug: 'features',
          match: '### Features',
          originalLevel: 3
        },
        {
          level: 2,
          text: 'Usage',
          slug: 'usage',
          match: '### Usage',
          originalLevel: 3
        },
        {
          level: 2,
          text: 'Props',
          slug: 'props',
          match: '### Props',
          originalLevel: 3
        }
      ],
      originalLevel: 2
    }
  ])

  assert.equal(clearIndexValues(toc.tree),
  [
    {
      level: 1,
      text: 'GitHub Stars',
      slug: 'github-stars',
      match: '# GitHub Stars',
      children: [
        {
          level: 2,
          text: 'Stars by date',
          slug: 'stars-by-date',
          match: '## Stars by date',
        },
        {
          level: 2,
          text: 'About this repo',
          slug: 'about-this-repo',
          match: '## About this repo',
          children: [
            {
              level: 3,
              text: 'Features',
              slug: 'features',
              match: '### Features',
            },
            {
              level: 3,
              text: 'Usage',
              slug: 'usage',
              match: '### Usage',
            },
            {
              level: 3,
              text: 'Props',
              slug: 'props',
              match: '### Props',
            },
          ],
        },
      ],
    },
  ])
})

const simpleMD = `
# Heading 1

stuff

## Heading 2

more stuff

### Heading 3

even more stuff

#### Heading 4

even more stuff
`

test('Generates Toc', async () => {
  const toc = normalizedTocObject(simpleMD)

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
              children: [
                {
                  level: 4,
                  text: 'Heading 4',
                  slug: 'heading-4',
                  match: '#### Heading 4',
                },
              ],
            },
          ],
        },
      ],
    },
  ])
})

const multipleLayersWithMultipleChildren = `
# Heading 1

stuff

## Heading 2

more stuff

### Heading 3

even more stuff

### Heading 3 2

even more stuff 2

### Heading 3 3

# 2nd Heading 1

stuff

## 2nd Heading 2

more stuff

### 2nd Heading 3

even more stuff

### 2nd Heading 3 2

even more stuff 2

### 2nd Heading 3 3

even more stuff 3
`

test('Generates Toc multipleLayersWithMultipleChildren', () => {
  const toc = normalizedTocObject(multipleLayersWithMultipleChildren)

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
            {
              level: 3,
              text: 'Heading 3 2',
              slug: 'heading-3-2',
              match: '### Heading 3 2',
            },
            {
              level: 3,
              text: 'Heading 3 3',
              slug: 'heading-3-3',
              match: '### Heading 3 3',
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
            {
              level: 3,
              text: '2nd Heading 3 2',
              slug: '2nd-heading-3-2',
              match: '### 2nd Heading 3 2',
            },
            {
              level: 3,
              text: '2nd Heading 3 3',
              slug: '2nd-heading-3-3',
              match: '### 2nd Heading 3 3',
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
    - [Heading 3 2](#heading-3-2)
    - [Heading 3 3](#heading-3-3)
- [2nd Heading 1](#2nd-heading-1)
  - [2nd Heading 2](#2nd-heading-2)
    - [2nd Heading 3](#2nd-heading-3)
    - [2nd Heading 3 2](#2nd-heading-3-2)
    - [2nd Heading 3 3](#2nd-heading-3-3)
  `.trim(), 'tocText')
})

const hash2Max = `
## Heading 2

stuff

## Heading 2 2

more stuff

### Heading 3

even more stuff

### Heading 3 2

even more stuff 2

### Heading 3 3

## 2nd Heading 2 2

stuff

## 2nd Heading 2

more stuff

### 2nd Heading 3

even more stuff

### 2nd Heading 3 2

even more stuff 2

### 2nd Heading 3 3

even more stuff 3
`

test('Generates Toc hash2Max', () => {
  const toc = normalizedTocObject(hash2Max)

  deepLog(toc)
  assert.equal(toc, [
    {
      level: 2,
      text: 'Heading 2',
      slug: 'heading-2',
      match: '## Heading 2',
    },
    {
      level: 2,
      text: 'Heading 2 2',
      slug: 'heading-2-2',
      match: '## Heading 2 2',
      children: [
        {
          level: 3,
          text: 'Heading 3',
          slug: 'heading-3',
          match: '### Heading 3',
        },
        {
          level: 3,
          text: 'Heading 3 2',
          slug: 'heading-3-2',
          match: '### Heading 3 2',
        },
        {
          level: 3,
          text: 'Heading 3 3',
          slug: 'heading-3-3',
          match: '### Heading 3 3',
        },
      ],
    },
    {
      level: 2,
      text: '2nd Heading 2 2',
      slug: '2nd-heading-2-2',
      match: '## 2nd Heading 2 2',
    },
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
        {
          level: 3,
          text: '2nd Heading 3 2',
          slug: '2nd-heading-3-2',
          match: '### 2nd Heading 3 2',
        },
        {
          level: 3,
          text: '2nd Heading 3 3',
          slug: '2nd-heading-3-3',
          match: '### 2nd Heading 3 3',
        },
      ],
    },
  ])
})

const headingBreaker = `
## Heading 2

stuff

## Heading 2 2

more stuff

### Heading 3

even more stuff

### Heading 3 2

even more stuff 2

### Heading 3 3

# Heading breaker

cool

## 2nd Heading 2 2

stuff

## 2nd Heading 2

more stuff

### 2nd Heading 3

even more stuff

### 2nd Heading 3 2

even more stuff 2

### 2nd Heading 3 3

even more stuff 3
`

const headingBreakerExpected = [
  {
    level: 2,
    text: 'Heading 2',
    slug: 'heading-2',
    match: '## Heading 2',
  },
  {
    level: 2,
    text: 'Heading 2 2',
    slug: 'heading-2-2',
    match: '## Heading 2 2',
    children: [
      {
        level: 3,
        text: 'Heading 3',
        slug: 'heading-3',
        match: '### Heading 3',
      },
      {
        level: 3,
        text: 'Heading 3 2',
        slug: 'heading-3-2',
        match: '### Heading 3 2',
      },
      {
        level: 3,
        text: 'Heading 3 3',
        slug: 'heading-3-3',
        match: '### Heading 3 3',
      },
    ],
  },
  {
    level: 1,
    text: 'Heading breaker',
    slug: 'heading-breaker',
    match: '# Heading breaker',
    children: [
      {
        level: 2,
        text: '2nd Heading 2 2',
        slug: '2nd-heading-2-2',
        match: '## 2nd Heading 2 2',
      },
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
          {
            level: 3,
            text: '2nd Heading 3 2',
            slug: '2nd-heading-3-2',
            match: '### 2nd Heading 3 2',
          },
          {
            level: 3,
            text: '2nd Heading 3 3',
            slug: '2nd-heading-3-3',
            match: '### 2nd Heading 3 3',
          },
        ],
      },
    ],
  },
]

test('Generates Toc headingBreaker', () => {
  const toc = normalizedTocObject(headingBreaker)

  deepLog(toc)
  assert.equal(toc, headingBreakerExpected)
})

test('Generates Toc headingBreaker with normalizeLevels hoists levels', () => {
  const toc = normalizedTocObject(headingBreaker)
  deepLog(toc)
  assert.equal(toc, headingBreakerExpected)

  const normalized = normalizeLevels(toc)
  deepLog(normalized)

  const normalizedExpected = [
    {
      level: 1,
      text: 'Heading 2',
      slug: 'heading-2',
      match: '## Heading 2',
      originalLevel: 2,
    },
    {
      level: 1,
      text: 'Heading 2 2',
      slug: 'heading-2-2',
      match: '## Heading 2 2',
      originalLevel: 2,
      children: [
        {
          level: 2,
          text: 'Heading 3',
          slug: 'heading-3',
          match: '### Heading 3',
          originalLevel: 3,
        },
        {
          level: 2,
          text: 'Heading 3 2',
          slug: 'heading-3-2',
          match: '### Heading 3 2',
          originalLevel: 3,
        },
        {
          level: 2,
          text: 'Heading 3 3',
          slug: 'heading-3-3',
          match: '### Heading 3 3',
          originalLevel: 3,
        },
      ],
    },
    {
      level: 1,
      text: 'Heading breaker',
      slug: 'heading-breaker',
      match: '# Heading breaker',
      children: [
        {
          level: 2,
          text: '2nd Heading 2 2',
          slug: '2nd-heading-2-2',
          match: '## 2nd Heading 2 2',
        },
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
            {
              level: 3,
              text: '2nd Heading 3 2',
              slug: '2nd-heading-3-2',
              match: '### 2nd Heading 3 2',
            },
            {
              level: 3,
              text: '2nd Heading 3 3',
              slug: '2nd-heading-3-3',
              match: '### 2nd Heading 3 3',
            },
          ],
        },
      ],
    },
  ]
  assert.equal(normalized, normalizedExpected)

  const tocTwo = normalizedTocObject(headingBreaker, { normalizeLevels: true })
  assert.equal(tocTwo, normalizedExpected, 'normalizeLevels option works')
})

test('html headers', () => {
  const htmlHeaders = `
<h1>Heading 1 html</h1>

stuff

<h2>Heading 2</h2>

more stuff

<h3>Heading 3</h3>

even more stuff

<h4>Heading 4</h4>

even more stuff

`

  const toc = normalizedTocObject(htmlHeaders)
  deepLog(toc)
  assert.equal(toc, [
    {
      level: 1,
      text: 'Heading 1 html',
      slug: 'heading-1-html',
      match: '<h1>Heading 1 html</h1>',
      children: [
        {
          level: 2,
          text: 'Heading 2',
          slug: 'heading-2',
          match: '<h2>Heading 2</h2>',
          children: [
            {
              level: 3,
              text: 'Heading 3',
              slug: 'heading-3',
              match: '<h3>Heading 3</h3>',
              children: [
                {
                  level: 4,
                  text: 'Heading 4',
                  slug: 'heading-4',
                  match: '<h4>Heading 4</h4>',
                },
              ],
            },
          ],
        },
      ],
    },
  ])
  const tocText = treeStringify(toc)
  // console.log('tocText html', tocText)

  assert.equal(tocText.text,
  `
- [Heading 1 html](#heading-1-html)
  - [Heading 2](#heading-2)
    - [Heading 3](#heading-3)
      - [Heading 4](#heading-4)
  `.trim(), 'tocText html')
})

const mixed = `
<h3>What is this?</h3>

# Heading 1

stuff

<h2>Heading 2 html</h2>

more stuff

<h3>Heading 3</h3>

even more stuff

#### Heading 4

end`

test('html and md headers mixed', () => {
  const toc = normalizedTocObject(mixed)

  deepLog(toc)

  assert.equal(toc, [
    {
      level: 3,
      text: 'What is this?',
      slug: 'what-is-this',
      match: '<h3>What is this?</h3>',
    },
    {
      level: 1,
      text: 'Heading 1',
      slug: 'heading-1',
      match: '# Heading 1',
      children: [
        {
          level: 2,
          text: 'Heading 2 html',
          slug: 'heading-2-html',
          match: '<h2>Heading 2 html</h2>',
          children: [
            {
              level: 3,
              text: 'Heading 3',
              slug: 'heading-3',
              match: '<h3>Heading 3</h3>',
              children: [
                {
                  level: 4,
                  text: 'Heading 4',
                  slug: 'heading-4',
                  match: '#### Heading 4',
                },
              ],
            },
          ],
        },
      ],
    },
  ])
})

const sixLayers = `
Headings with links:

# [Heading 1 stacked](https://google.com)

## [Heading 2 stacked](https://google.com)

### [Heading 3 stacked](https://google.com)

#### [Heading 4 stacked](https://google.com)

##### [Heading 5 stacked](https://google.com)

###### [Heading 6 stacked](https://google.com)
`

test('sixLayers', () => {
  const toc = normalizedTocObject(sixLayers)

  deepLog(toc)

  assert.equal(toc, [
    {
      level: 1,
      text: '[Heading 1 stacked](https://google.com)',
      slug: 'heading-1-stackedhttpsgooglecom',
      match: '# [Heading 1 stacked](https://google.com)',
      children: [
        {
          level: 2,
          text: '[Heading 2 stacked](https://google.com)',
          slug: 'heading-2-stackedhttpsgooglecom',
          match: '## [Heading 2 stacked](https://google.com)',
          children: [
            {
              level: 3,
              text: '[Heading 3 stacked](https://google.com)',
              slug: 'heading-3-stackedhttpsgooglecom',
              match: '### [Heading 3 stacked](https://google.com)',
              children: [
                {
                  level: 4,
                  text: '[Heading 4 stacked](https://google.com)',
                  slug: 'heading-4-stackedhttpsgooglecom',
                  match: '#### [Heading 4 stacked](https://google.com)',
                  children: [
                    {
                      level: 5,
                      text: '[Heading 5 stacked](https://google.com)',
                      slug: 'heading-5-stackedhttpsgooglecom',
                      match: '##### [Heading 5 stacked](https://google.com)',
                      children: [
                        {
                          level: 6,
                          text: '[Heading 6 stacked](https://google.com)',
                          slug: 'heading-6-stackedhttpsgooglecom',
                          match: '###### [Heading 6 stacked](https://google.com)',
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ])
})

const codeFence = (before, after) => `
Ignore code fences

${before}

\`\`\`
# [Heading 1 stacked](https://google.com)

## [Heading 2 stacked](https://google.com)

### [Heading 3 stacked](https://google.com)

#### [Heading 4 stacked](https://google.com)

##### [Heading 5 stacked](https://google.com)

###### [Heading 6 stacked](https://google.com)

\`\`\`

${after}
`

test('Ignore code fences', () => {
  const toc = normalizedTocObject(codeFence())
  /*
  deepLog(toc)
  /** */
  assert.equal(toc, [])
  const toc2 = normalizedTocObject(codeBlock('# heading 1'))
  /*
  deepLog(toc2)
  /** */
  assert.equal(toc2, [
    {
      level: 1,
      text: 'heading 1',
      slug: 'heading-1',
      match: '# heading 1',
    },
  ])
})

const codeBlock = (before, after) => `
Ignore code blocks

${before}

<pre>
# [Heading 1 stacked](https://google.com)

## [Heading 2 stacked](https://google.com)

### [Heading 3 stacked](https://google.com)

#### [Heading 4 stacked](https://google.com)

##### [Heading 5 stacked](https://google.com)

###### [Heading 6 stacked](https://google.com)

</pre>

${after}
`

test('Ignore codeBlock', () => {
  const toc = normalizedTocObject(codeBlock())
  /*
  deepLog(toc)
  /** */
  assert.equal(toc, [])

  const toc2 = normalizedTocObject(codeBlock('# heading 1'))
  /*
  deepLog(toc2)
  /** */
  assert.equal(toc2, [
    {
      level: 1,
      text: 'heading 1',
      slug: 'heading-1',
      match: '# heading 1',
    },
  ])
})


test('Deeply nested md toc', () => {
  const md = `
# Heading 1

## Heading 2

### Heading 3

### Heading 3 2

### Heading 3 3

#### Heading 4

##### Heading 5 nested 1

##### Heading 5 nested 2

#### Heading 4 2

#### Heading 4 3

##### Heading 5

###### Heading 6

## Heading 2 2

### Heading 3 2 2

### Heading 3 2 3

#### Heading 4 2 2

# Heading 1 2

# Heading 1 3
`
  const toc = normalizedTocObject(md, {
    // removeTocItems: ['Heading 1 2'],
    // removeTocItems: ['# Heading 1 2'],
    // removeTocItems: ['Heading 1 2', 'Heading 1 3'],
    // removeTocItems: /Heading 2/,
    //removeTocItems: /# Heading 1 3/,
    // removeTocItems: [/Heading 3 2 2/, /Heading 4 2/],
    // removeTocItems: (item) => {
    //   if (item.text === 'Heading 1 2') {
    //     return false
    //   }
    //   // include
    //   return true
    // }
  })
  deepLog('og toc', toc)
  // process.exit(1)

  const tocText = treeStringify(toc, {
    stripFirstH1: false,
    maxDepth: 3,
  })

  console.log('tocText')
  console.log(tocText)
  assert.equal(tocText.text, `
- [Heading 1](#heading-1)
  - [Heading 2](#heading-2)
    - [Heading 3](#heading-3)
    - [Heading 3 2](#heading-3-2)
    - [Heading 3 3](#heading-3-3)
  - [Heading 2 2](#heading-2-2)
    - [Heading 3 2 2](#heading-3-2-2)
    - [Heading 3 2 3](#heading-3-2-3)
- [Heading 1 2](#heading-1-2)
- [Heading 1 3](#heading-1-3)
`.trim(), 'tocText big')
})


const mdWithTableOfContents = `
# Heading 1

This is blah blah blah

## Table of contents

Toc here

## Heading 2

This is blah blah blah

### Heading 3

This is blah blah blah
`

test('Filter out Table of Contents heading', () => {
  const toc = normalizedTocObject(mdWithTableOfContents, {
    removeTocItems: /Table of Contents/i,
  })
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
              match: '### Heading 3'
            }
          ]
        }
      ]
    }
  ])
})


const mdWithSubSections = `
# Heading 1

This is blah blah blah

## Heading 2

This is blah blah blah

### Heading 3

This is blah blah blah

### Heading 3 2

This is blah blah blah

## Heading 2 B

This is blah blah blah

### Heading 3 B

This is blah blah blah

### Heading 3 B

This is blah blah blah
`

test('Get Sub-Section manually', () => {
  const toc = normalizedTocObject(mdWithSubSections)
  /*
  deepLog(toc)
  console.log(toc[0].children[0])
  // process.exit(1)
  /** */


  const normalized = normalizeLevels([toc[0].children[0]], 1)
  const subSectionToc = treeStringify(normalized)
  /*
  console.log('normalized', normalized)
  deepLog(subSectionToc.text)
  // process.exit(1)
  /** */

  assert.equal(subSectionToc.text,
`- [Heading 2](#heading-2)
  - [Heading 3](#heading-3)
  - [Heading 3 2](#heading-3-2)
`.trim(), 'subSectionToc.text')

  assert.equal(subSectionToc.tocItems, [
    {
      level: 1,
      text: 'Heading 2',
      slug: 'heading-2',
      match: '## Heading 2',
      originalLevel: 2,
      children: [
        {
          level: 2,
          text: 'Heading 3',
          slug: 'heading-3',
          match: '### Heading 3',
          originalLevel: 3
        },
        {
          level: 2,
          text: 'Heading 3 2',
          slug: 'heading-3-2',
          match: '### Heading 3 2',
          originalLevel: 3
        }
      ]
    }
  ])
})


test('Get Sub-Section via options.subSection', () => {
  const subSectionTree = normalizedTocObject(mdWithSubSections, {
    subSection: {
      match: /Heading 2/,
      index: 37
    },
    // subSection: /Heading 2/,
    // subSection: 'Heading 2',
    // subSection: 'Heading 2',
    // removeTocItems: /Table of Contents/i,
  })
  deepLog(subSectionTree)

  const subSectionToc = treeStringify(subSectionTree)
  deepLog(subSectionToc)

  assert.equal(subSectionToc.text, `
- [Heading 2](#heading-2)
  - [Heading 3](#heading-3)
  - [Heading 3 2](#heading-3-2)
`.trim(), 'subSectionToc.text')

  assert.equal(subSectionToc.tocItems, [
    {
      level: 1,
      text: 'Heading 2',
      slug: 'heading-2',
      match: '## Heading 2',
      originalLevel: 2,
      children: [
        {
          level: 2,
          text: 'Heading 3',
          slug: 'heading-3',
          match: '### Heading 3',
          originalLevel: 3
        },
        {
          level: 2,
          text: 'Heading 3 2',
          slug: 'heading-3-2',
          match: '### Heading 3 2',
          originalLevel: 3
        }
      ]
    }
  ])
})


test('normalizeLevels', () => {
  const md = `# Heading 1
Cool

<!-- doc-gen TOC maxDepth="4" -->
  - [one](#one)
    - [xxxx](#xxxx)
    - [yyy](#yyy)
      - [four](#four)
<!-- end-doc-gen -->

## one

### xxxx

### yyy

#### four

## one two
  `
  const toc = generateToc(md, {
    stripFirstH1: true,
    normalizeLevels: true,
  })
  // deepLog('x',toc.text)
  assert.equal(toc.text,
  `- [one](#one)
  - [xxxx](#xxxx)
  - [yyy](#yyy)
    - [four](#four)
- [one two](#one-two)`)
})



function normalizedTocObject(str, opts = {}) {
  const toc = treeBuild(str, opts)
  return toc.map(removeIndexFromObj)
}

function removeIndexFromObj(obj) {
  const { index, children, ...rest } = obj
  if (children && children.length > 0) {
    rest.children = children.map(removeIndexFromObj)
  }
  return rest
}

test.run()
