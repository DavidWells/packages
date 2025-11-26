// Deep comparison of serverless configurations to detect specific changes
const { getDeploymentStrategy, createHash } = require('./deployment-strategy')

/**
 * Deep compare two objects and find differences with paths
 * @param {string} basePath - Base path for this comparison (e.g., "functions.hello")
 * @param {any} oldValue - Old value
 * @param {any} newValue - New value
 * @param {Array} differences - Array to collect differences
 */
function findObjectDifferences(basePath, oldValue, newValue, differences = []) {
  // Handle null/undefined cases
  if (oldValue === null || oldValue === undefined) {
    if (newValue !== null && newValue !== undefined) {
      differences.push({
        path: basePath,
        description: `added: ${JSON.stringify(newValue)}`,
        oldValue: oldValue,
        newValue: newValue,
        changeType: 'added'
      })
    }
    return differences
  }

  if (newValue === null || newValue === undefined) {
    differences.push({
      path: basePath,
      description: `removed`,
      oldValue: oldValue,
      newValue: newValue,
      changeType: 'removed'
    })
    return differences
  }

  // Handle primitive types
  if (typeof oldValue !== 'object' || typeof newValue !== 'object') {
    if (oldValue !== newValue) {
      differences.push({
        path: basePath,
        description: `${oldValue} → ${newValue}`,
        oldValue: oldValue,
        newValue: newValue,
        changeType: 'changed'
      })
    }
    return differences
  }

  // Handle arrays
  if (Array.isArray(oldValue) || Array.isArray(newValue)) {
    const oldStr = JSON.stringify(oldValue)
    const newStr = JSON.stringify(newValue)
    if (oldStr !== newStr) {
      differences.push({
        path: basePath,
        description: `array changed`,
        oldValue: oldValue,
        newValue: newValue,
        changeType: 'changed'
      })
    }
    return differences
  }

  // Handle objects - recurse into properties
  const allKeys = new Set([...Object.keys(oldValue), ...Object.keys(newValue)])

  for (const key of allKeys) {
    const newPath = basePath ? `${basePath}.${key}` : key
    const oldProp = oldValue[key]
    const newProp = newValue[key]

    if (!(key in oldValue)) {
      // Property added
      differences.push({
        path: newPath,
        description: `added: ${JSON.stringify(newProp)}`,
        oldValue: undefined,
        newValue: newProp,
        changeType: 'added'
      })
    } else if (!(key in newValue)) {
      // Property removed
      differences.push({
        path: newPath,
        description: `removed`,
        oldValue: oldProp,
        newValue: undefined,
        changeType: 'removed'
      })
    } else if (typeof oldProp === 'object' && typeof newProp === 'object' && !Array.isArray(oldProp) && !Array.isArray(newProp)) {
      // Recurse into nested objects
      findObjectDifferences(newPath, oldProp, newProp, differences)
    } else {
      // Compare values
      const oldStr = JSON.stringify(oldProp)
      const newStr = JSON.stringify(newProp)
      if (oldStr !== newStr) {
        differences.push({
          path: newPath,
          description: `${oldStr} → ${newStr}`,
          oldValue: oldProp,
          newValue: newProp,
          changeType: 'changed'
        })
      }
    }
  }

  return differences
}

/**
 * Analyze what changed in a serverless config file and categorize by deployment strategy
 * @param {object} oldConfig - Previous config (can be null if file is new)
 * @param {object} newConfig - Current config
 * @returns {object} - Categorized changes with deployment strategies
 */
function analyzeConfigChanges(oldConfig, newConfig) {
  const categorized = {
    fastSdkUpdate: [],
    fullDeploy: [],
    unknown: []
  }

  // If no old config, this is a new service - full deploy required
  if (!oldConfig) {
    categorized.fullDeploy.push({
      path: 'service',
      description: 'New serverless service',
      strategy: 'fullDeploy',
      changeType: 'added'
    })
    return categorized
  }

  // Find all differences
  const differences = findObjectDifferences('', oldConfig, newConfig)

  // Categorize each difference by deployment strategy
  for (const diff of differences) {
    const strategy = getDeploymentStrategy(diff.path)
    const changeInfo = {
      ...diff,
      strategy
    }

    if (strategy === 'fastSdkUpdate') {
      categorized.fastSdkUpdate.push(changeInfo)
    } else if (strategy === 'fullDeploy') {
      categorized.fullDeploy.push(changeInfo)
    } else {
      categorized.unknown.push(changeInfo)
    }
  }

  return categorized
}

/**
 * Analyze per-function config changes with deployment strategy
 * @param {object} oldConfig - Previous serverless config
 * @param {object} newConfig - Current serverless config
 * @returns {object} - Per-function changes categorized by deployment strategy
 */
function analyzeFunctionConfigChanges(oldConfig, newConfig) {
  const functionChanges = {}

  if (!oldConfig || !newConfig) {
    return functionChanges
  }

  const oldFunctions = oldConfig.functions || {}
  const newFunctions = newConfig.functions || {}

  // Get all function names (union of old and new)
  const allFunctionNames = new Set([
    ...Object.keys(oldFunctions),
    ...Object.keys(newFunctions)
  ])

  for (const fnName of allFunctionNames) {
    const oldFn = oldFunctions[fnName]
    const newFn = newFunctions[fnName]

    if (!oldFn && newFn) {
      // New function added
      functionChanges[fnName] = {
        changeType: 'added',
        deploymentStrategy: 'fullDeploy',
        changes: {
          fullDeploy: [{
            path: `functions.${fnName}`,
            description: 'Function added',
            strategy: 'fullDeploy',
            changeType: 'added'
          }]
        }
      }
    } else if (oldFn && !newFn) {
      // Function removed
      functionChanges[fnName] = {
        changeType: 'removed',
        deploymentStrategy: 'fullDeploy',
        changes: {
          fullDeploy: [{
            path: `functions.${fnName}`,
            description: 'Function removed',
            strategy: 'fullDeploy',
            changeType: 'removed'
          }]
        }
      }
    } else if (oldFn && newFn) {
      // Function exists in both - check for changes
      const differences = findObjectDifferences(`functions.${fnName}`, oldFn, newFn)

      if (differences.length > 0) {
        const categorized = {
          fastSdkUpdate: [],
          fullDeploy: [],
          unknown: []
        }

        // Categorize each difference
        for (const diff of differences) {
          const strategy = getDeploymentStrategy(diff.path)
          const changeInfo = { ...diff, strategy }

          if (strategy === 'fastSdkUpdate') {
            categorized.fastSdkUpdate.push(changeInfo)
          } else if (strategy === 'fullDeploy') {
            categorized.fullDeploy.push(changeInfo)
          } else {
            categorized.unknown.push(changeInfo)
          }
        }

        // Determine overall deployment strategy for this function
        // If ANY change requires fullDeploy, the whole function needs fullDeploy
        let deploymentStrategy = 'none'
        if (categorized.fullDeploy.length > 0 || categorized.unknown.length > 0) {
          deploymentStrategy = 'fullDeploy'
        } else if (categorized.fastSdkUpdate.length > 0) {
          deploymentStrategy = 'fastSdkUpdate'
        }

        functionChanges[fnName] = {
          changeType: 'modified',
          deploymentStrategy,
          changes: categorized
        }
      }
    }
  }

  return functionChanges
}

module.exports = {
  findObjectDifferences,
  analyzeConfigChanges,
  analyzeFunctionConfigChanges
}
