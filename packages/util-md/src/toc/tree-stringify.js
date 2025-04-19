const { deepLog } = require('../utils/logger')

function treeStringify(tocTree, options = {
  skipH1: false,
  stripFirstH1: false,
  maxDepth: Infinity,
  stripToc: false,
}) {
  let isFirstH1 = true

  function processItems(items, level = 0, parentIsStripped = false) {
    let toc = ''
    let usedItems = []

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      const effectiveLevel = parentIsStripped ? item.level - 1 : item.level
      if (effectiveLevel > options.maxDepth) continue

      let isItemUsed = false
      const usedItem = Object.assign({}, item)
      delete usedItem.children

      if (item.level === 1) {
        const shouldStrip = options.skipH1 || (options.stripFirstH1 && isFirstH1)
        if (!shouldStrip) {
          toc += `- [${item.text}](#${item.slug})\n`
          isItemUsed = true
        }
        isFirstH1 = false
        if (item.children) {
          const [childToc, childUsedItems] = processItems(item.children, level + 1, shouldStrip)
          toc += childToc
          if (shouldStrip) {
            // Add children directly to root level when H1 is stripped
            for (let j = 0; j < childUsedItems.length; j++) {
              usedItems.push(childUsedItems[j])
            }
          } else if (isItemUsed) {
            // If this item is used, add it with its children
            usedItem.children = childUsedItems
            usedItems.push(usedItem)
          }
        } else if (isItemUsed) {
          usedItems.push(usedItem)
        }
      } else {
        const indent = '  '.repeat(parentIsStripped ? item.level - 2 : item.level - 1)
        toc += `${indent}- [${item.text}](#${item.slug})\n`
        isItemUsed = true

        if (item.children) {
          const [childToc, childUsedItems] = processItems(item.children, level + 1, parentIsStripped)
          toc += childToc
          if (childUsedItems.length > 0) {
            usedItem.children = childUsedItems
          }
        }

        usedItems.push(usedItem)
      }
    }

    return [toc, usedItems]
  }

  const [mdText, tocItems] = processItems(tocTree)
  // const deepClone = JSON.parse(JSON.stringify(tocItems))
  // const tocItemsNormalized = normalizeLevels(deepClone)
  // deepLog('normalizeLevels', tocItemsNormalized)
  // deepLog('tocItems', tocItems)

  const text = mdText.replace(/\n$/, '')
  return {
    text,
    tocItems,
  }
}

function removeTocFromToc(contents) {
  return contents
    .replace(/(.*)\[Table of Contents\]\(.*\)\n?/i, '')
    .replace(/(.*)\[toc\]\(.*\)\n?/i, '')
}

module.exports = {
  treeStringify,
}
