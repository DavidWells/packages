# Markdown utils

Fast, dependency-light markdown utilities. Parse frontmatter, build tables of contents, and find headings, links, images, code blocks, footnotes, and HTML tags in markdown strings.

Everything is plain string/regex parsing plus an optional AST — no remark/unified pipeline to configure. Each utility is also published as its own export path, so you only pay for what you import.

## Install

```bash
npm install @davidwells/md-utils
```

## Quick start

```js
const { parseMarkdown } = require('@davidwells/md-utils')

const result = parseMarkdown(`---
title: My Post
date: 2024-03-01
tags: [markdown, tools]
---

# My Post

Intro text with a [link](https://example.com) and an ![image](./img/logo.png).

## Install

\`\`\`bash
npm install thing
\`\`\`
`, { filePath: 'posts/my-post.md' })

result.data       // { title: 'My Post', date: 2024-03-01T00:00:00.000Z, tags: ['markdown', 'tools'] }
result.date       // '2024-03-01'
result.links      // [ 'https://example.com' ]
result.images     // [ './img/logo.png' ]
result.codeBlocks // [ { line: 13, index: 168, syntax: 'bash', block: '```bash\nnpm install thing\n```', code: 'npm install thing' } ]
result.toc        // nested heading tree
result.errors     // []
```

Both CommonJS and ESM work:

```js
const { parseMarkdown } = require('@davidwells/md-utils')
```

```js
import { parseMarkdown } from '@davidwells/md-utils'
```

## Which parser should I import?

`parseMarkdown` is the full, all-inclusive parser. It is intentionally bigger
because it includes frontmatter parsing, AST parsing, TOC generation, links,
images, refs, footnotes, and code blocks.

If you only need one part of the markdown metadata pipeline, use the smaller
`parseMarkdownWithX` helpers.

| I need... | Import | Parses YAML frontmatter? |
| --- | --- | --- |
| everything | `@davidwells/md-utils/parse` | yes |
| content + parsed frontmatter | `@davidwells/md-utils/parse/frontmatter` | yes |
| content + TOC | `@davidwells/md-utils/parse/toc` | no |
| content + code blocks | `@davidwells/md-utils/parse/code-blocks` | no |
| content + links/images/refs | `@davidwells/md-utils/parse/links` | no |

```js
import { parseMarkdown } from '@davidwells/md-utils/parse'
import { parseMarkdownWithFrontmatter } from '@davidwells/md-utils/parse/frontmatter'
import { parseMarkdownWithToc } from '@davidwells/md-utils/parse/toc'
import { parseMarkdownWithCodeBlocks } from '@davidwells/md-utils/parse/code-blocks'
import { parseMarkdownWithLinks } from '@davidwells/md-utils/parse/links'
```

Frontmatter parsing is explicit. If you import
`parseMarkdownWithFrontmatter`, you pay the `gray-matter` / YAML cost. The
other `withX` helpers operate on markdown content and do not parse
frontmatter.

```js
const doc = parseMarkdownWithFrontmatter(markdown)
const outline = parseMarkdownWithToc(doc.content)
```

## API

### Main entry

```js
const {
  parseMarkdown,
  parseFrontmatter,
  generateToc,
  extractSection,
  removeLeadingH1,
  dedentString,
} = require('@davidwells/md-utils')
```

#### `parseMarkdown(text, [options])`

The full parser. Returns everything about a markdown document in one pass.

**Options**

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `filePath` | `string` | – | Used in error messages and as a fallback source for `date` |
| `validator` | `function` | – | `(content, filePath) => string[]`, extra errors appended to `errors` |
| `astParser` | `function` | – | `(content, opts) => ast`, replaces the default `micro-mdx-parser` |
| `includeAst` | `boolean` | `true` | Include the parsed AST |
| `includeToc` | `boolean` | `true` | Include the heading tree |
| `includeLinks` | `boolean` | `true` | Include `links` |
| `includeRefs` | `boolean` | `true` | Include reference-style link definitions |
| `includeImages` | `boolean` | `true` | Include `images` |
| `includeFootnotes` | `boolean` | `true` | Include `footnotes` |
| `includeCodeBlocks` | `boolean` | `true` | Include `codeBlocks` |
| `includePositions` | `boolean` | `false` | Include node positions in the AST |
| `includeRawFrontmatter` | `boolean` | `false` | Include the raw `---` block as `frontMatterRaw` |

**Returns** an object with `filePath`, `date`, `ast`, `data`, `toc`, `frontMatterRaw`, `links`, `refs`, `footnotes`, `images`, `codeBlocks`, `content`, and `errors` (keys are omitted when their `includeX` option is off, and `filePath`/`date` only appear when resolved).

Parsing never throws. Broken or missing frontmatter degrades to "the whole document is content" and pushes a message onto `errors`:

```js
parseMarkdown('# No frontmatter here', { filePath: 'a.md' }).errors
// [ 'Missing or broken frontmatter in a.md. Double check file for --- frontmatter tags' ]
```

#### `parseFrontmatter(text)`

Parses YAML frontmatter with [gray-matter](https://www.npmjs.com/package/gray-matter). Throws a line-numbered error if the YAML is invalid.

```js
parseFrontmatter('---\ntitle: My Post\n---\n\n# My Post')
// { data: { title: 'My Post' }, content: '\n# My Post', frontMatterRaw: '---\ntitle: My Post\n---', isHidden: false, ... }

parseFrontmatter('# hi')
// { data: {}, content: '# hi' }
```

#### `generateToc(contents, [options])`

See [Table of contents](#table-of-contents).

#### `extractSection(content, sectionTitle, [options])`

Pulls the body of a single section out of a markdown string. `#` characters inside fenced code blocks are ignored, so code samples don't terminate the section early. Returns `undefined` when the section isn't found.

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `level` | `number` | `2` | Heading level to match |
| `includeHeader` | `boolean` | `false` | Prepend the matched heading to the result |
| `caseSensitive` | `boolean` | `false` | Match the title case-sensitively |

```js
extractSection('## A\n\ntext a\n\n### B\n\ntext b\n', 'B', { level: 3, includeHeader: true })
// '### B\n\ntext b'
```

#### `removeLeadingH1(text)`

Strips the first `# heading`, `Setext\n====` heading, or `<h1>` from a document while preserving frontmatter.

```js
removeLeadingH1('# Title\n\nbody') // 'body'
```

#### `dedentString(text, [minIndent])`

Removes the common leading indentation from every line.

```js
dedentString('    a\n      b') // 'a\n  b'
```

### Focused parsers

Each returns `{ content, errors, ...}` plus `filePath` when you pass one.

#### `parseMarkdownWithFrontmatter(text, [options])`

`@davidwells/md-utils/parse/frontmatter` — returns `{ data, content, frontMatterRaw, isHidden, errors }`. Set `includeRawFrontmatter: false` to drop `frontMatterRaw` (default `true`). YAML errors land in `errors` rather than throwing.

#### `parseMarkdownWithToc(text, [options])`

`@davidwells/md-utils/parse/toc` — returns `{ content, toc, errors }`. Extra options are forwarded to [`treeBuild`](#treebuildcontents-options).

> Note: this helper does not strip frontmatter, so heading `index` values are offsets into the raw string you passed in. Feed it `parseMarkdownWithFrontmatter(md).content` if you want content-relative offsets.

#### `parseMarkdownWithCodeBlocks(text, [options])`

`@davidwells/md-utils/parse/code-blocks` — returns `{ content, codeBlocks, errors }`. Extra options are forwarded to [`findCodeBlocks`](#findcodeblockstext-options).

#### `parseMarkdownWithLinks(text, [options])`

`@davidwells/md-utils/parse/links` — returns `{ content, links, refs, images, errors }`. Accepts `frontmatter` (to also collect links found in frontmatter values) and `unique`.

```js
parseMarkdownWithLinks(md)
// { content: '...', links: ['https://example.com'], refs: [], images: ['./img/logo.png'], errors: [] }
```

### Table of contents

```js
const { generateToc, treeBuild, treeStringify, normalizeLevels } = require('@davidwells/md-utils/toc')
```

#### `generateToc(contents, [options])`

Builds the tree and renders it to markdown in one call. Returns `{ text, tocItems, tree }`.

```js
const md = `# Title

## One

### Deep

## Two
`

generateToc(md).text
// - [Title](#title)
//   - [One](#one)
//     - [Deep](#deep)
//   - [Two](#two)

generateToc(md, { maxDepth: 2 }).text
// - [Title](#title)
//   - [One](#one)
//   - [Two](#two)

generateToc(md, { stripFirstH1: true }).text
// - [One](#one)
//   - [Deep](#deep)
// - [Two](#two)
```

Options are shared between the tree builder and the stringifier:

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `maxDepth` | `number` | `Infinity` | Deepest heading level to render |
| `stripFirstH1` | `boolean` | `false` | Drop the first `h1`, promoting its children |
| `skipH1` | `boolean` | `false` | Drop every `h1` |
| `includeHtmlHeaders` | `boolean` | `true` | Also pick up `<h1>`–`<h6>` tags |
| `trimLeadingHeading` | `number` | – | Remove the leading heading of this level before building |
| `excludeIndex` | `boolean` | `false` | Omit the `index` character offset from each item |
| `normalizeLevels` | `boolean` | `false` | Shift levels so the shallowest heading becomes the root |
| `subSection` | `string\|object` | – | Build a TOC for just one section |
| `headings` | `array` | – | Use pre-parsed headings instead of scanning the text |
| `removeTocItems` | `string\|RegExp\|function\|array` | – | Filter items out of the tree |
| `slugFn` | `function` | github-style `slugifyText` | Custom base slug function |

```js
generateToc(md, { removeTocItems: 'Two' }).text
// - [Title](#title)
//   - [One](#one)
//     - [Deep](#deep)

generateToc(md, { removeTocItems: (item) => item.level > 2 }).text
// - [Title](#title)
//   - [One](#one)
//   - [Two](#two)

generateToc(md, { slugFn: (text) => 'x-' + text.toLowerCase() }).text
// - [Title](#x-title) ...
```

#### `treeBuild(contents, [options])`

Returns the nested tree only. Each item is `{ level, text, slug, match, index, children? }`.

```js
treeBuild('# Title\n\n## One\n')
// [
//   {
//     level: 1, text: 'Title', slug: 'title', match: '# Title', index: 0,
//     children: [ { level: 2, text: 'One', slug: 'one', match: '## One', index: 9 } ]
//   }
// ]
```

Duplicate headings get github-style suffixes (`setup`, `setup-1`, `setup-2`), and explicit HTML `id` attributes are honored.

#### `treeStringify(tree, [options])`

Renders a tree to `{ text, tocItems }`. Reads `maxDepth`, `stripFirstH1`, and `skipH1`.

#### `normalizeLevels(items, [forcedMinLevel])`

Shifts heading levels so the shallowest becomes the root level. **Mutates** the array in place and records the previous level on `originalLevel`.

Also available at `@davidwells/md-utils/toc/normalize`.

### Finders

Each finder is its own export path and works on a raw markdown string.

#### `findHeadings(text, [options])`

`@davidwells/md-utils/find-headings`

```js
const { findHeadings, findLeadingHeading, removeLeadingHeading, findClosestParentHeading } = require('@davidwells/md-utils/find-headings')

findHeadings('# A\n\n## B\n')
// [ { text: 'A', match: '# A', level: 1, index: 0 }, { text: 'B', match: '## B', level: 2, index: 5 } ]
```

Handles ATX (`#`), Setext (`====` / `----`), and — with `includeHtmlHeaders: true` — HTML headings. Headings inside fenced code blocks and `<aside>` blocks are skipped.

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `maxDepth` | `number` | `6` | Deepest heading level to return |
| `includeHtmlHeaders` | `boolean` | `false` | Also match `<h1>`–`<h6>` |
| `includeAsideHeadings` | `boolean` | `false` | Include headings inside `<aside>` |
| `excludeIndex` | `boolean` | `false` | Omit the `index` character offset |
| `filter` | `function` | – | `(heading) => boolean`, keep only truthy matches |
| `codeBlocks` | `object` | – | Pre-parsed `findCodeBlocks` result, avoids a re-scan |

- `findLeadingHeading(text)` → `{ match, type, level }` for the document's opening heading
- `removeLeadingHeading(text, level)` → text with the leading heading of that level removed
- `findClosestParentHeading(text, indexOrMatchText, [options])` → the nearest enclosing heading, or `null`

#### `findLinks(text, [options])`

`@davidwells/md-utils/find-links`

```js
const { findLinks, findAbsoluteLinks, findRelativeLinks, findRefLinks } = require('@davidwells/md-utils/find-links')

findLinks('Text with [link](https://example.com) and ![img](./a.png).')
// { refs: [], links: [ 'https://example.com' ], images: [ './a.png' ] }
```

Covers inline links, reference links, naked `https://` URLs, `<angle>` links, and (with `frontmatter` passed) links nested anywhere in frontmatter values. Links inside code blocks are ignored. `unique` defaults to `true`.

#### `findImages(content, [options])`

`@davidwells/md-utils/find-images`

```js
findImages('![img](./a.png)')
// { all: [ './a.png' ], absolute: [], relative: [ './a.png' ], md: [ './a.png' ] }
```

Also exports `findAbsoluteImages`, `findRelativeImages`, `findMarkdownImages`, `MARKDOWN_IMAGE_REGEX`, and `RELATIVE_IMAGES_REGEX`.

#### `findCodeBlocks(text, [options])`

`@davidwells/md-utils/find-code-blocks`

Handles ``` and `~~~` fences (3 or 4 ticks), fences inside blockquotes, `<pre>`/`<code>` HTML, and single-backtick inline blocks with a language hint.

```js
findCodeBlocks('```js title="foo.js" highlight={1}\nvar a = 1\n```')
// {
//   errors: [],
//   blocks: [{
//     line: 1,
//     index: 0,
//     propsRaw: ' title="foo.js" highlight={1}',
//     props: { title: 'foo.js', highlight: 1 },
//     syntax: 'js',
//     block: '```js title="foo.js" highlight={1}\nvar a = 1\n```',
//     code: 'var a = 1'
//   }]
// }
```

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `filePath` | `string` | – | Included in error messages |
| `includePositions` | `boolean` | `true` | Add `line` and `index` to each block |
| `dedentCode` | `boolean` | `true` | Dedent the extracted `code` |
| `includePreTags` | `boolean` | `true` | Also match `<pre>` / `<code>` HTML blocks |
| `trimLeadingComment` | `boolean` | `false` | Strip a leading JS comment from `code` (kept on `comment`) |

Fence attributes are parsed with [oparser](https://www.npmjs.com/package/oparser), so `title="x"`, `highlight={1}`, and friends come back as typed values on `props`.

Also exports `removeCode(text)` (strips fenced and inline code), `collectSingleLineCodeBlocks(text)`, `CODE_BLOCK_RE`, and `CODE_BLOCK_HTML_RE`.

#### `findFrontmatter(text)`

`@davidwells/md-utils/find-frontmatter`

Locates the frontmatter block without parsing YAML.

```js
findFrontmatter('---\ntitle: My Post\n---\n\n# My Post')
// { frontMatterRaw: '---\ntitle: My Post\n---', frontMatter: '---\ntitle: My Post\n---', isHidden: false }
```

Also exports `removeFrontmatter(text)`, `FRONTMATTER_REGEX`, and `HIDDEN_FRONTMATTER_REGEX`.

#### `findFootnotes(text)`

`@davidwells/md-utils/find-footnotes`

```js
findFootnotes('[^1]: hi there\n')
// [ { id: '1', content: 'hi there' } ]
```

Multi-line indented footnote bodies are dedented. Also exports `FOOTNOTE_REGEX`.

#### `findDate(options)`

`@davidwells/md-utils/find-date`

Resolves a `YYYY-MM-DD` string from frontmatter, falling back to a date in the file path.

```js
findDate({ frontmatter: {}, filePath: '2023-05-01-post.md' }) // '2023-05-01'
findDate({ frontmatter: { published: '2024-01-02' }, dateKey: 'published' }) // '2024-01-02'
```

Also exports `convertDateToString(value)`, which normalizes a `Date` to `YYYY-MM-DD`.

#### `findHtmlTags(text)`

`@davidwells/md-utils/find-html-tags`

```js
findHtmlTags('<h2 id="html-heading">HTML heading</h2>')
// [ { tag: 'h2', props: { id: 'html-heading' }, raw: '<h2 id="html-heading">HTML heading</h2>' } ]
```

Also exports `MATCH_HTML_TAGS_REGEX`.

#### `findUnmatchedHtmlTags(text, [filePath])`

`@davidwells/md-utils/find-unmatched-html-tags`

Flags void tags (`br`, `hr`, `img`, `embed`, `col`, `link`, `meta`) that aren't self-closed — useful for MDX, where they're a hard error.

```js
findUnmatchedHtmlTags('Hello <br> world', 'docs/a.md')
// [ {
//     message: 'Unclosing HTML tag on line 1 in docs/a.md.\n    Need closing tag "/>" on:   \n<br>',
//     brokenTag: '<br>',
//     correctUsage: '<br/>'
//   } ]
```

Also exports `CLOSE_TAG_REGEX`.

### String utils

`@davidwells/md-utils/string-utils`

```js
const { removeLeadingH1, addLineNumbers, removeSurroundingEmptyLines } = require('@davidwells/md-utils/string-utils')

addLineNumbers({ content: 'a\nb', startLine: 1 })
// '     1\ta\n     2\tb'
```

### Slugger

`@davidwells/md-utils/slugger`

```js
const { slugifyText, makeSlug, cleanHeadingText, smartSlugger } = require('@davidwells/md-utils/slugger')

slugifyText('Hello World! & more')   // 'hello-world-more'
cleanHeadingText('Install [the thing](https://x.com)[^1] [#custom-id]') // 'Install the thing'
```

`slugifyText` is the github-style slugger (transliterates accented Latin, strips everything outside `[a-z0-9- ]`). `cleanHeadingText` reduces raw heading markdown to its rendered words so markdown syntax, URLs, HTML tags, footnote markers, and explicit `[#id]` suffixes never leak into slugs.

`smartSlugger(customFn)` returns a stateful slugger that dedupes:

```js
const slugger = smartSlugger(slugifyText)
slugger('Setup') // 'setup'
slugger('Setup') // 'setup-1'
slugger('Setup') // 'setup-2'

slugger.reserve('setup')  // register an authored DOM id verbatim, so generated slugs suffix around it
slugger.base              // the underlying slug function, without dedupe state
```

### Dedent

`@davidwells/md-utils/dedent`

```js
const dedent = require('@davidwells/md-utils/dedent')
dedent('    a\n      b') // 'a\n  b'
```

## Export paths

| Path | Exports |
| --- | --- |
| `@davidwells/md-utils` | `parseMarkdown`, `parseFrontmatter`, `generateToc`, `extractSection`, `removeLeadingH1`, `dedentString` |
| `@davidwells/md-utils/parse` | `parseMarkdown` |
| `@davidwells/md-utils/parse/frontmatter` | `parseMarkdownWithFrontmatter` |
| `@davidwells/md-utils/parse/toc` | `parseMarkdownWithToc` |
| `@davidwells/md-utils/parse/code-blocks` | `parseMarkdownWithCodeBlocks` |
| `@davidwells/md-utils/parse/links` | `parseMarkdownWithLinks` |
| `@davidwells/md-utils/frontmatter` | `parseFrontmatter`, `findFrontmatter` |
| `@davidwells/md-utils/toc` | `generateToc`, `treeBuild`, `treeStringify`, `normalizeLevels` |
| `@davidwells/md-utils/toc/normalize` | `normalizeLevels` |
| `@davidwells/md-utils/find-headings` | `findHeadings`, `findLeadingHeading`, `removeLeadingHeading`, `findClosestParentHeading` |
| `@davidwells/md-utils/find-links` | `findLinks`, `findAbsoluteLinks`, `findRelativeLinks`, `findRefLinks` |
| `@davidwells/md-utils/find-images` | `findImages`, `findAbsoluteImages`, `findRelativeImages`, `findMarkdownImages`, `MARKDOWN_IMAGE_REGEX`, `RELATIVE_IMAGES_REGEX` |
| `@davidwells/md-utils/find-code-blocks` | `findCodeBlocks`, `removeCode`, `collectSingleLineCodeBlocks`, `CODE_BLOCK_RE`, `CODE_BLOCK_HTML_RE` |
| `@davidwells/md-utils/find-frontmatter` | `findFrontmatter`, `removeFrontmatter`, `FRONTMATTER_REGEX`, `HIDDEN_FRONTMATTER_REGEX` |
| `@davidwells/md-utils/find-footnotes` | `findFootnotes`, `FOOTNOTE_REGEX` |
| `@davidwells/md-utils/find-date` | `findDate`, `convertDateToString` |
| `@davidwells/md-utils/find-html-tags` | `findHtmlTags`, `MATCH_HTML_TAGS_REGEX` |
| `@davidwells/md-utils/find-unmatched-html-tags` | `findUnmatchedHtmlTags`, `CLOSE_TAG_REGEX` |
| `@davidwells/md-utils/extract-section` | `extractSection` |
| `@davidwells/md-utils/string-utils` | `removeLeadingH1`, `addLineNumbers`, `removeSurroundingEmptyLines` |
| `@davidwells/md-utils/slugger` | `slugifyText`, `makeSlug`, `cleanHeadingText`, `smartSlugger` |
| `@davidwells/md-utils/dedent` | default export `dedent` (ESM also exports it as `dedentString`) |

The main entry and the `parse*`, `frontmatter`, `toc`, `slugger`, and `dedent` paths resolve to a dedicated ESM build (`.mjs`) under `import` and a CJS build (`.js`) under `require`. The `find-*`, `string-utils`, and `extract-section` paths resolve to the same `.js` file either way; Node's named-export detection handles the `import { ... }` form.

## Tests

```bash
npm test
```

## Other packages

- https://www.npmjs.com/package/markdown-magic
