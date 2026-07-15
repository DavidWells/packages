# Markdown utils

Markdown utilities

## Install

```
npm install @davidwells/md-utils
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

## Other packages

- https://www.npmjs.com/package/markdown-magic
