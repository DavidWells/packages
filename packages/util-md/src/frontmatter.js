const matter = require('gray-matter')
const { findFrontmatter } = require('./find-frontmatter')

// alt https://github.com/natemoo-re/ultramatter/tree/main
// alt https://www.npmjs.com/package/@github-docs/frontmatter

function parseFrontmatter(text) {
  const { frontMatter, frontMatterRaw, isHidden } = findFrontmatter(text)
  // console.log('frontMatter', frontMatter)
  let frontmatter = { data: {}, content: text }
  /* Missing all frontmatter */
  if (!frontMatter) {
    // throw new Error(`Missing or broken frontmatter in ${filePath}. Double check file for --- frontmatter tags in files`)
    return frontmatter
  }

  let mdContent = text
  if (frontMatterRaw) {
    mdContent = text
    // Replace frontmatter brackets
      .replace(frontMatterRaw, frontMatter)
    // Replace leading lines
    // .replace(/---+\s+\n/g, '---\n')
  }

  try {
    frontmatter = matter(mdContent)
  } catch (err) {
    /* Add line numbers to output */
    const formattedError = frontMatterRaw.split('\n').map((line, i) => {
      return `${i + 1}. ${line}`
    })
    throw new Error(`Frontmatter error:\n${err.message}\n${formattedError.join('\n')}`)
  }
  // console.log('frontMatter', frontmatter)
  return Object.assign(frontmatter, { frontMatterRaw, isHidden })
}

module.exports = {
  parseFrontmatter,
  findFrontmatter,
}
