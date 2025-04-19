---
title: 'Promisified node.js file system utilities'
author: David Wells
date: 2020-05-10
layout: post
category: snippets
tags:
  - javascript
  - node
---

## Code blocks

For code blocks that allows multiple lines, syntax highlighting, line numbers and line highlighting, use triple backticks for code fencing:

Look, a beautiful `console.log("Hello World"){:js}` JavaScript inline code!

````md
Four tick box
````

```javascript prop=here
console.log('test')
```

`js console.log('hello, \`world')`


For code blocks that allows `js alert('hello')` multiple lines, syntax highlighting, line numbers and line highlighting

Javascript example:

## Inline code

https://shiki.style/packages/rehype#inline-code

Look, a beautiful `console.log("Hello World"){:js}` JavaScript inline code!

```md
This code `console.log("Hello World"){:js}` will be highlighted.
```

## Post contents

Node introduced the `promisify` utilities in back in version 8.

There are a couple bits missing from the core node.js filesystem.

Below is the promisified file system calls I use a bunch in projects.

I've added `createDir`, `fileExists`, and `deleteDir` to smooth over some of the core `fs` methods that can be a little awkward to work with.
Let me know if you have other file system utilities you like to use in the comments below.
