export { normalizeLevels } from './normalize.mjs'
export { treeBuild } from './tree-build.mjs'
export { treeStringify } from './tree-stringify.mjs'

import { treeBuild } from './tree-build.mjs'
import { treeStringify } from './tree-stringify.mjs'

function generateToc(contents, opts = {}) {
  const tree = treeBuild(contents, opts)
  const result = treeStringify(tree, opts)
  result.tree = tree
  return result
}

export { generateToc }
