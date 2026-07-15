// Alt https://github.com/technote-space/anchor-markdown-header/blob/master/src/index.ts

function makeSlug(text = '') {
  const STRIP_CHARS = /[\u2000-\u206F\u2E00-\u2E7F\\'!"#$%&()*+,./:;<=>?@[\]^`{|}~]/g

  return text
    .replace(/[^a-z0-9 -_\t]*/gi, '')
    .trim()
    .toLowerCase()
    .replace(STRIP_CHARS, '')
    .replace(/\s/g, '-')
}

/* GitHub-style heading slug: transliterate accented Latin, strip anything
   outside [a-z0-9- ], collapse spaces/dashes, trim edge dashes, lowercase.
   Must stay in sync with slugify in @davidwells/markdown lib/utils/slugify.js */
function slugifyText(str = '') {
  return str
    .replace(/[ÀÁÂÃÄÅàáâãäåæÆ]/g, 'a')
    .replace(/[çÇ]/g, 'c')
    .replace(/[ðÐ]/g, 'd')
    .replace(/[ÈÉÊËéèêë]/g, 'e')
    .replace(/[ÏïÎîÍíÌì]/g, 'i')
    .replace(/[Ññ]/g, 'n')
    .replace(/[øØœŒÕõÔôÓóÒò]/g, 'o')
    .replace(/[ÜüÛûÚúÙù]/g, 'u')
    .replace(/[ŸÿÝý]/g, 'y')
    .replace(/[^a-z0-9- ]/gi, '')
    .trim()
    .replace(/ +/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
}

/**
 * Stateful slug generator: dedupes repeated slugs github-style (foo, foo-1, foo-2)
 * @param {Function} [customFn] - Base slug function, defaults to makeSlug
 * @returns {Function} slugger(text) -> unique slug. Also exposes:
 *   slugger.reserve(exactId) - registers an id VERBATIM (no normalization) so
 *   generated slugs suffix around it. For authored DOM ids / explicit heading ids.
 *   slugger.base(text) - the base slug function without dedup state.
 */

/* Cleans raw heading text down to its rendered words so slugs never leak
   markdown syntax, urls, tag names, or footnote markers into ids.
   Must stay in sync with cleanHeadingText in @davidwells/markdown lib/utils/heading-text.js */
const MARKDOWN_LINK_R = /\[([^\]]*)\]\(([^)]*)\)/g
const FOOTNOTE_MARKER_R = /\[\^[^\]]*\]/g
const EXPLICIT_HEADING_ID_R = /\[#([^\]]+)\]\s*$/
const HTML_TAG_R = /<\/?[a-zA-Z][^>]*>/g

function cleanHeadingText(rawText = '') {
  return rawText
    .replace(EXPLICIT_HEADING_ID_R, '')
    .replace(FOOTNOTE_MARKER_R, '')
    .replace(MARKDOWN_LINK_R, '$1')
    .replace(HTML_TAG_R, '')
    .trim()
}

function smartSlugger(customFn) {
  const usedSlugs = new Set()
  const occurrences = {}
  const slugFn = (typeof customFn === 'function') ? customFn : makeSlug

  const slugger = (text) => {
    const slug = slugFn(text)

    if (!usedSlugs.has(slug)) {
      usedSlugs.add(slug)
      occurrences[slug] = 0
      return slug
    }

    if (!occurrences[slug]) {
      occurrences[slug] = 0
    }

    /* Skip suffixes already taken by reserved ids or literal "-N" heading text */
    let newSlug
    do {
      occurrences[slug] = occurrences[slug] + 1
      newSlug = `${slug}-${occurrences[slug]}`
    } while (usedSlugs.has(newSlug))
    usedSlugs.add(newSlug)
    return newSlug
  }

  slugger.reserve = (exactId) => {
    if (typeof exactId !== 'string' || exactId === '') {
      return
    }
    usedSlugs.add(exactId)
  }

  slugger.base = slugFn

  return slugger
}

module.exports = {
  makeSlug,
  cleanHeadingText,
  slugifyText,
  smartSlugger
}
