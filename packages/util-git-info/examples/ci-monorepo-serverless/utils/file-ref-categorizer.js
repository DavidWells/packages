// Categorize config file reference changes (like env.yml) by deployment strategy
const path = require('path')
const { getDeploymentStrategy, extractFunctionName } = require('./deployment-strategy')
const { minimatch } = require('minimatch')

/**
 * Check if a file path matches a glob pattern
 * @param {string} filePath - File path to check
 * @param {string} pattern - Glob pattern (may contain variables like ${...})
 * @param {string} baseDir - Base directory for resolving relative paths
 * @returns {boolean} - True if file matches pattern
 */
function matchesGlobPattern(filePath, pattern, baseDir) {
  // If pattern has variables, convert to glob wildcard
  // e.g., "./env.${self:provider.stage}.yml" -> "./env.*.yml"
  const globPattern = pattern.replace(/\$\{[^}]+\}/g, '*')

  // Resolve the pattern relative to baseDir
  const resolvedPattern = path.resolve(baseDir, globPattern)

  // Check if file matches the glob pattern
  return minimatch(filePath, resolvedPattern)
}

/**
 * Categorize config file reference changes by deployment strategy
 * Maps changed files → variable paths → deployment strategy
 * @param {Array<string>} changedFiles - Array of changed file paths (relative to git root)
 * @param {object} metadata - Config metadata from configorama
 * @param {object} gitInfo - Git info object
 * @param {string} configFile - Path to serverless config file
 * @returns {object} - Categorized changes
 */
function categorizeConfigFileRefChanges(changedFiles, metadata, gitInfo, configFile) {
  const categorized = {
    fastSdkUpdate: [],
    fullDeploy: [],
    unknown: []
  }

  if (!metadata || !metadata.variables || changedFiles.length === 0) {
    return categorized
  }

  const parentDir = path.dirname(configFile)

  // Map each changed file to the variables that reference it
  for (const changedFile of changedFiles) {
    const absoluteChangedFile = path.isAbsolute(changedFile)
      ? changedFile
      : path.join(gitInfo.dir, changedFile)

    // Check each variable to see if it references this changed file
    for (const [variableString, variableInstances] of Object.entries(metadata.variables)) {
      // Check if this variable references a file
      if (!variableString.includes('${file(')) continue

      for (const instance of variableInstances) {
        const configPath = instance.path

        // Check if any resolve details reference the changed file
        let referencesChangedFile = instance.resolveDetails?.some(detail => {
          if (detail.variableType === 'file') {
            // Extract the file path from varString: "file(./env.yml):KEY" or "file(./path.yml)"
            const match = detail.varString?.match(/^file\(([^)]+)\)/)
            if (match) {
              const referencedFile = match[1]

              // First try exact match after resolution
              const absoluteRef = path.resolve(parentDir, referencedFile)
              if (absoluteRef === absoluteChangedFile ||
                  path.relative(gitInfo.dir, absoluteRef) === changedFile) {
                return true
              }

              // If the referenced file has variables (like ${self:provider.stage}),
              // try glob matching
              if (referencedFile.includes('${')) {
                return matchesGlobPattern(absoluteChangedFile, referencedFile, parentDir)
              }
            }
          }
          return false
        })

        if (referencesChangedFile) {
          const { strategy, reason } = getDeploymentStrategy(configPath)
          const functionName = extractFunctionName(configPath)
          const changeInfo = {
            ...(functionName && { functionName }),
            type: 'referencesChangedFile',
            strategy,
            reason,
            file: changedFile,
            variable: variableString,
            configPath: configPath,

          }

          if (strategy === 'fastSdkUpdate') {
            categorized.fastSdkUpdate.push(changeInfo)
          } else if (strategy === 'fullDeploy') {
            categorized.fullDeploy.push(changeInfo)
          } else {
            categorized.unknown.push(changeInfo)
          }
        }
      }
    }
  }

  return categorized
}

module.exports = {
  categorizeConfigFileRefChanges
}
