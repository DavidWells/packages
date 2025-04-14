const path = require('path')
const fs = require('fs')
const { test } = require('uvu')
const assert = require('uvu/assert')
const { findCodeBlocks, collectSingleLineCodeBlocks } = require('./find-code-blocks')
const { parseFrontmatter } = require('./frontmatter')

const FILE_WITH_CODE = path.join(__dirname, '../fixtures/file-with-code.md')
const FILE_WITH_CODE_INLINE = path.join(__dirname, '../fixtures/file-with-code-inline.md')
const FILE_WITH_CODE_TILDE = path.join(__dirname, '../fixtures/file-with-code-tilde.md')
const FILE_WITH_HTML_CODE = path.join(__dirname, '../fixtures/file-with-html-code.md')
const FILE_WITH_BLOCKQUOTE_CODE = path.join(__dirname, '../fixtures/file-with-quote-code.md')

function read(filePath) {
  return fs.readFileSync(filePath, 'utf-8')
}

test('findCodeBlocks ```', async () => {
  const code = findCodeBlocks(read(FILE_WITH_CODE))
  //*
  console.log('code', code)
  /** */

  assert.is(typeof code, 'object')
  assert.is(Array.isArray(code.blocks), true)
  assert.is(Array.isArray(code.errors), true)

  // Nested code fence works
  assert.equal(code.blocks[2], {
    line: 24,
    index: 397,
    syntax: 'md',
    block: "````md\n```javascript\nconsole.log('test')\n```\n````",
    code: "```javascript\nconsole.log('test')\n```"
  })
})

test('collectSingleLineCodeBlocks', async () => {
  const code = findCodeBlocks(read(FILE_WITH_CODE_INLINE))
  console.log('code', code)
  assert.equal(code.blocks.length, 7)
})

test('findCodeBlocks html', async () => {
  const code = findCodeBlocks(read(FILE_WITH_HTML_CODE))
  //*
  console.log('html code', code)
  /** */
  // Nested code fence works
  assert.equal(code.blocks[0], {
    line: 16,
    index: 321,
    syntax: 'html',
    block: '```html\n' +
        '<p align="center">\n' +
        '  <img width="460" height="300" src="https://picsum.photos/460/300" />\n' +
        '</p>\n' +
        '```',
    code: '<p align="center">\n' +
        '  <img width="460" height="300" src="https://picsum.photos/460/300" />\n' +
        '</p>'
  })
})

test('findCodeBlocks with ~~~', async () => {
  const code = findCodeBlocks(read(FILE_WITH_CODE_TILDE))
  //*
  console.log('code', code)
  /** */

  assert.is(typeof code, 'object')
  assert.is(Array.isArray(code.blocks), true)
  assert.is(Array.isArray(code.errors), true)

  // Nested code fence works
  assert.equal(code.blocks[0], {
    line: 16,
    index: 321,
    syntax: 'md',
    block: '~~~md\nFour tick box\n~~~',
    code: 'Four tick box'
  })

  assert.equal(code.blocks[1], {
    line: 20,
    index: 346,
    propsRaw: ' prop=here',
    props: {
      prop: 'here'
    },
    syntax: 'javascript',
    block: "~~~javascript prop=here\nconsole.log('test')\n~~~",
    code: "console.log('test')"
  })
})


test('findCodeBlocks in blockquotes', async () => {
  const code = findCodeBlocks(read(FILE_WITH_BLOCKQUOTE_CODE))
  /*
  console.log('code', code)
  /** */
  assert.equal(code, {
    blocks: [
      {
        line: 16,
        index: 321,
        syntax: 'html',
        block: '```html\n' +
        '<p align="center">\n' +
        '  <img width="460" height="300" src="https://picsum.photos/460/300" />\n' +
        '</p>\n' +
        '```',
        code: '<p align="center">\n' +
        '  <img width="460" height="300" src="https://picsum.photos/460/300" />\n' +
        '</p>'
      },
      {
        line: 33,
        index: 726,
        syntax: 'js',
        prefix: '> ',
        block: '> ```js\n' +
        "> const { Analytics } = require('analytics')\n" +
        '>\n' +
        '> const analytics = Analytics({\n' +
        ">   app: 'my-app-name',\n" +
        '>   version: 100,\n' +
        '>   plugins: [\n' +
        '>     googleAnalyticsPlugin({\n' +
        ">       trackingId: 'UA-121991291',\n" +
        '>     }),\n' +
        '>     customerIOPlugin({\n' +
        ">       siteId: '123-xyz'\n" +
        '>     })\n' +
        '>   ]\n' +
        '> })\n' +
        '>\n' +
        '> // Fire a page view\n' +
        '> analytics.page()\n' +
        '> ```',
        code: "const { Analytics } = require('analytics')\n" +
        '\n' +
        'const analytics = Analytics({\n' +
        "  app: 'my-app-name',\n" +
        '  version: 100,\n' +
        '  plugins: [\n' +
        '    googleAnalyticsPlugin({\n' +
        "      trackingId: 'UA-121991291',\n" +
        '    }),\n' +
        '    customerIOPlugin({\n' +
        "      siteId: '123-xyz'\n" +
        '    })\n' +
        '  ]\n' +
        '})\n' +
        '\n' +
        '// Fire a page view\n' +
        'analytics.page()',
      },
      {
        line: 60,
        index: 1326,
        syntax: 'js',
        block: '> > ```js\n' +
        "> > const { Analytics } = require('analytics')\n" +
        "> > console.log('lol')\n" +
        '> > ```',
        code: "const { Analytics } = require('analytics')\nconsole.log('lol')",
        prefix: '> > '
      }
    ],
    errors: []
  })
})

test('Match // comments', async () => {
  const code = findCodeBlocks(`
\`\`\`js
// Comment here
console.log('test')
\`\`\`
`)
  /*
  console.log('code', code)
  /** */
  // Nested code fence works
  assert.equal(code.blocks[0], {
    line: 2,
    index: 1,
    syntax: 'js',
    block: "```js\n// Comment here\nconsole.log('test')\n```",
    comment: '// Comment here',
    code: "// Comment here\nconsole.log('test')"
  })

  const codeTwo = findCodeBlocks(`
\`\`\`js
// Comment here
console.log('test')
\`\`\`
`, {
  trimLeadingComment: true,
})

  assert.equal(codeTwo.blocks[0], {
    line: 2,
    index: 1,
    syntax: 'js',
    block: "```js\n// Comment here\nconsole.log('test')\n```",
    comment: '// Comment here',
    code: "console.log('test')"
  })
})

test('Match /* comments */', async () => {
  const md = `
\`\`\`js
/* Comment here */
console.log('test')
\`\`\`
`
  const code = findCodeBlocks(md)
  /*
  console.log('code', code)
  /** */
  // Nested code fence works
  assert.equal(code.blocks[0], {
    line: 2,
    index: 1,
    syntax: 'js',
    block: "```js\n/* Comment here */\nconsole.log('test')\n```",
    comment: '/* Comment here */',
    code: "/* Comment here */\nconsole.log('test')"
  })

  const codeTwo = findCodeBlocks(md, {
    trimLeadingComment: true,
  })

  assert.equal(codeTwo.blocks[0], {
    line: 2,
    index: 1,
    syntax: 'js',
    block: "```js\n/* Comment here */\nconsole.log('test')\n```",
    comment: '/* Comment here */',
    code: "console.log('test')"
  })
})

test('Match nested code blocks ``` inside ````', async () => {
  const code = findCodeBlocks(`
\`\`\`\`md
\`\`\`javascript
console.log('test')
\`\`\`
\`\`\`\`
`)
  //*
  console.log('code', code)
  /** */
  // Nested code fence works
  assert.equal(code.blocks[0], {
    line: 2,
    index: 1,
    syntax: 'md',
    block: "````md\n```javascript\nconsole.log('test')\n```\n````",
    code: "```javascript\nconsole.log('test')\n```"
  })
})


test('findCodeBlocks with opts', async () => {
  const code = findCodeBlocks(`
\`\`\`js lines=1-5 noHighlight
import { useState } from 'react'

function Counter() {
  const [count, setCount] = useState(0)
  return <button onClick={() => setCount(count + 1)}>{count}</button>
}
\`\`\`
`)
  /*
  console.log('code', code.blocks)
  /** */
  assert.equal(code.blocks[0].syntax, 'js')
  assert.equal(code.blocks[0].props.lines, '1-5')
  assert.equal(code.blocks[0].props.noHighlight, true)
})

test.run()
