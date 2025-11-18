const path = require('path')
const fs = require('fs')
const configorama = require('configorama')
const { gitDetails } = require('../src')
const { extractDeps } = require('@davidwells/extract-deps')
const { resolveDepPaths } = require('@davidwells/extract-deps/dep-graph')


const util = require('util')


function logValue(value, isFirst, isLast) {
  const prefix = `${isFirst ? '> ' : ''}`
  if (typeof value === 'object') {
    console.log(`${util.inspect(value, false, null, true)}\n`)
    return
  }
  if (isFirst) {
    console.log(`\n\x1b[33m${prefix}${value}\x1b[0m`)
    return
  }
  console.log((typeof value === 'string' && value.includes('\n')) ? `\`${value}\`` : value)
  // isLast && console.log(`\x1b[37m\x1b[1m${'─'.repeat(94)}\x1b[0m\n`)
}

function deepLog() {
  for (let i = 0; i < arguments.length; i++) logValue(arguments[i], i === 0, i === arguments.length - 1)
}

/**
 * Deployment strategy rules
 * Maps config change paths to the type of deployment required
 */
const deploymentStrategyRules = {
  // Fast SDK updates - Lambda configuration only (~5 seconds)
  fastSdkUpdate: [
    'functions.*.environment',          // Environment variables
    'functions.*.environment.*',        // Individual env var changes
    'functions.*.env',                  // Function-level env (Serverless shorthand)
    'functions.*.env.*',                // Individual function-level env var changes
    'functions.*.memorySize',           // Memory allocation
    'functions.*.timeout',              // Timeout value
    'functions.*.layers',               // Lambda layers
    'functions.*.vpc',                  // VPC configuration
    'functions.*.tracing',              // X-Ray tracing mode
    'functions.*.reservedConcurrency',  // Reserved concurrent executions
    'functions.*.description',          // Function description
  ],

  // Full deploy required - affects CloudFormation resources (~60+ seconds)
  fullDeploy: [
    'functions.*.events',               // Any event configuration changes
    'functions.*.events.*',             // Individual event changes
    'functions.*.handler',              // Handler changes (usually with code)
    'functions.*.runtime',              // Runtime changes
    'functions.*.role',                 // IAM role changes
    'functions.*.iamRoleStatements',    // IAM policy changes
    'provider.*',                       // Provider-level changes
    'service.*',                        // Service-level changes
  ]
}

/**
 * Match a change path against a pattern with wildcards
 */
function matchesPathPattern(path, pattern) {
  const regexPattern = pattern
    .split('.')
    .map(part => part === '*' ? '[^.]+' : part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('\\.')
  const regex = new RegExp(`^${regexPattern}$`)
  return regex.test(path)
}

/**
 * Determine the deployment strategy required for a specific change
 */
function getDeploymentStrategy(changePath) {
  // Check fullDeploy patterns first (more restrictive)
  for (const pattern of deploymentStrategyRules.fullDeploy) {
    if (matchesPathPattern(changePath, pattern)) {
      return 'fullDeploy'
    }
  }

  // Check fastSdkUpdate patterns
  for (const pattern of deploymentStrategyRules.fastSdkUpdate) {
    if (matchesPathPattern(changePath, pattern)) {
      return 'fastSdkUpdate'
    }
  }

  // Unknown change type - default to full deploy for safety
  return 'fullDeploy'
}

/**
 * Categorize config file reference changes by deployment strategy
 * Maps changed files → variable paths → deployment strategy
 */
function categorizeConfigChanges(changedFiles, metadata, gitInfo, configFile) {
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
        const referencesChangedFile = instance.resolveDetails?.some(detail => {
          if (detail.varType && detail.varType.startsWith('file(')) {
            // Extract the file path from the varType
            const match = detail.varType.match(/file\(([^)]+)\)/)
            if (match) {
              const referencedFile = match[1]
              const absoluteRef = path.resolve(parentDir, referencedFile)
              return absoluteRef === absoluteChangedFile ||
                     path.relative(gitInfo.dir, absoluteRef) === changedFile
            }
          }
          return false
        })

        if (referencesChangedFile) {
          const strategy = getDeploymentStrategy(configPath)
          const changeInfo = {
            file: changedFile,
            variable: variableString,
            configPath: configPath,
            strategy: strategy
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


/**
 * Serverless Monorepo Change Detection
 *
 * This example detects changes in serverless projects within a monorepo:
 * 1. Finds all directories containing serverless config files (serverless.yml, serverless.ts, serverless.js)
 * 2. Detects if those directories or their subdirectories have changed
 * 3. Checks if package.json files in those directories have been modified
 * 4. Extracts function handlers from serverless configuration files
 */

async function detectServerlessChanges() {
  let gitInfo
  try {
    // Compare against master branch, including uncommitted changes
    gitInfo = await gitDetails({ base: 'master', includeWorkingChanges: true })

    // Alternatively, to compare between specific commits:
    // gitInfo = await gitDetails({ base: 'master', head: 'HEAD' })
  } catch (err) {
    console.log('Error getting git info')
    console.log(err)
    return
  }

  console.log('gitInfo', gitInfo)

  console.log('⚡ Serverless Monorepo Change Detection\n')
  console.log('═══════════════════════════════════════════\n')

  // Find all serverless config files using fileMatch
  const serverlessConfigsGitInfo = gitInfo.fileMatch([
    '**/serverless.yml',
    '**/serverless.yaml',
    '**/serverless.ts',
    '**/serverless.js'
  ])

  console.log(serverlessConfigsGitInfo)

  // Get all changed files
  const allChangedFiles = [
    ...gitInfo.modifiedFiles,
    ...gitInfo.createdFiles,
    ...gitInfo.deletedFiles
  ]

  console.log('allChangedFiles', allChangedFiles)

  // Find all directories containing serverless config files
  const serverlessDirectories = await findServerlessDirectories(gitInfo.dir)
  console.log('serverlessDirectories')
  console.log(serverlessDirectories)

  if (serverlessDirectories.length === 0) {
    console.log('ℹ️  No serverless projects found in repository')
    return
  }

  console.log(`📦 Found ${serverlessDirectories.length} serverless project(s)\n`)

  const changedProjects = []

  // Check each serverless directory for changes
  for (const projectDir of serverlessDirectories) {
    const projectPath = path.relative(gitInfo.dir, projectDir)
    console.log('projectPath', projectPath)
    const configFile = getServerlessConfigFile(projectDir)

    // Check if any files in this directory (or subdirectories) have changed
    const projectChanges = allChangedFiles.filter(file => {
      // File is the project directory itself
      if (file === projectPath) {
        return true
      }

      // File is in a subdirectory of the project
      if (file.startsWith(projectPath + '/')) {
        return true
      }

      return false
    })

    console.log('projectChanges', projectChanges)

    if (projectChanges.length === 0) {
      continue // No changes in this project
    }

    // Detect package.json changes
    const packageJsonPath = path.join(projectPath, 'package.json')
    const packageJsonChanges = projectChanges.filter(file =>
      file === packageJsonPath || file.includes('/package.json')
    )

    // Detect serverless config changes
    const configChanges = projectChanges.filter(file =>
      file.includes('serverless.yml') ||
      file.includes('serverless.yaml') ||
      file.includes('serverless.ts') ||
      file.includes('serverless.js')
    )

    console.log('configChanges', configChanges)

    // Extract function details from the serverless config
    const { functionDetails, configFileRefs, fileGlobPatterns, metadata } = await extractFunctionDetails(configFile)

    console.log('functionDetails', functionDetails)
    console.log('configFileRefs', configFileRefs)
    console.log('fileGlobPatterns', fileGlobPatterns)

    // Check if any config file references have changed
    const configFileRefChanges = projectChanges.filter(file => {
      // Check exact file references
      const exactMatch = configFileRefs.some(ref => {
        const relativeRef = path.relative(gitInfo.dir, ref)
        return file === relativeRef || file.includes(relativeRef)
      })

      if (exactMatch) return true

      // Check glob patterns using gitInfo.fileMatch
      const globMatch = fileGlobPatterns.some(({ pattern, baseDir }) => {
        // Normalize pattern by removing leading './'
        const normalizedPattern = pattern.startsWith('./') ? pattern.slice(2) : pattern
        // Construct full pattern from git root
        const fullPattern = path.join(path.relative(gitInfo.dir, baseDir), normalizedPattern)
        const matches = gitInfo.fileMatch(fullPattern)
        // Check if current file is in the matches
        return matches.modifiedFiles.includes(file) ||
               matches.createdFiles.includes(file) ||
               matches.deletedFiles.includes(file)
      })

      return globMatch
    })

    console.log('configFileRefChanges', configFileRefChanges)

    // Categorize config file ref changes by deployment strategy
    const categorizedChanges = categorizeConfigChanges(configFileRefChanges, metadata, gitInfo, configFile)
    console.log('categorizedChanges', categorizedChanges)

    // Detect changes to function handler files and their dependencies
    const handlerChanges = projectChanges.filter(file => {
      return functionDetails.some(handler => {
        const handlerPath = handler.file.replace(/\\/g, '/')
        const fileMatches = file.includes(handlerPath) || file.startsWith(path.join(projectPath, handlerPath))

        // Also check if any dependencies have changed
        if (handler.dependencies && handler.dependencies.length > 0) {
          const depMatches = handler.dependencies.some(dep => {
            const relativeDep = path.relative(gitInfo.dir, dep)
            return file === relativeDep || file.includes(relativeDep)
          })
          return fileMatches || depMatches
        }

        return fileMatches
      })
    })

    changedProjects.push({
      name: path.basename(projectDir),
      path: projectPath,
      configFile: path.relative(gitInfo.dir, configFile),
      totalChanges: projectChanges.length,
      changes: {
        modified: projectChanges.filter(f => gitInfo.modifiedFiles.includes(f)),
        created: projectChanges.filter(f => gitInfo.createdFiles.includes(f)),
        deleted: projectChanges.filter(f => gitInfo.deletedFiles.includes(f))
      },
      packageJsonChanged: packageJsonChanges.length > 0,
      configChanged: configChanges.length > 0,
      configFileRefChanged: configFileRefChanges.length > 0,
      functionDetails,
      handlerChanges: handlerChanges.map(f => path.relative(projectPath, f)),
      configFileRefChanges: {
        modified: configFileRefChanges.filter(f => gitInfo.modifiedFiles.includes(f)).map(f => path.relative(projectPath, f)),
        created: configFileRefChanges.filter(f => gitInfo.createdFiles.includes(f)).map(f => path.relative(projectPath, f)),
        deleted: configFileRefChanges.filter(f => gitInfo.deletedFiles.includes(f)).map(f => path.relative(projectPath, f))
      },
      deploymentStrategy: categorizedChanges
    })
  }

  console.log('changedProjects', changedProjects)

  if (changedProjects.length === 0) {
    console.log('✅ No serverless projects have changed')
    return
  }

  console.log(`🎯 ${changedProjects.length} serverless project(s) changed:\n`)

  // Display detailed information for each changed project
  changedProjects.forEach((project, index) => {
    console.log(`${index + 1}. 📦 ${project.name}`)
    console.log(`   Path: ${project.path}`)
    console.log(`   Config: ${project.configFile}\n`)
    console.log(`   Files changed: ${project.totalChanges}`)

    // Modified files
    if (project.changes.modified.length > 0) {
      console.log(`   • ${project.changes.modified.length} modified`)
      project.changes.modified.forEach(file => {
        console.log(`     - ${path.relative(project.path, file)}`)
      })
    } else {
      console.log(`   • ${project.changes.modified.length} modified`)
    }

    // Created files
    if (project.changes.created.length > 0) {
      console.log(`   • ${project.changes.created.length} created`)
      project.changes.created.forEach(file => {
        console.log(`     - ${path.relative(project.path, file)}`)
      })
    } else {
      console.log(`   • ${project.changes.created.length} created`)
    }

    // Deleted files
    if (project.changes.deleted.length > 0) {
      console.log(`   • ${project.changes.deleted.length} deleted`)
      project.changes.deleted.forEach(file => {
        console.log(`     - ${path.relative(project.path, file)}`)
      })
    } else {
      console.log(`   • ${project.changes.deleted.length} deleted`)
    }

    console.log()

    // Important changes
    if (project.packageJsonChanged) {
      console.log('   ⚠️  Dependencies changed (package.json)')
    }
    if (project.configChanged) {
      console.log('   ⚠️  Serverless configuration changed')
    }
    if (project.configFileRefChanged) {
      console.log('   ⚠️  Config file references changed')
      if (project.configFileRefChanges.modified.length > 0) {
      console.log('       Modified:')
        project.configFileRefChanges.modified.forEach(file => {
          console.log(`        • ${file}`)
        })
      }
      if (project.configFileRefChanges.created.length > 0) {
      console.log('       Created:')
        project.configFileRefChanges.created.forEach(file => {
          console.log(`        • ${file}`)
        })
      }
      if (project.configFileRefChanges.deleted.length > 0) {
      console.log('       Deleted:')
        project.configFileRefChanges.deleted.forEach(file => {
          console.log(`        • ${file}`)
        })
      }

      // Show deployment strategy analysis
      if (project.deploymentStrategy) {
        const { fastSdkUpdate, fullDeploy } = project.deploymentStrategy
        if (fastSdkUpdate.length > 0) {
          console.log('\n   ⚡ Fast SDK Update Required (~5 seconds):')
          fastSdkUpdate.forEach(change => {
            console.log(`        • ${change.configPath}`)
            console.log(`          File: ${change.file}`)
          })
        }
        if (fullDeploy.length > 0) {
          console.log('\n   🚀 Full Deploy Required (~60+ seconds):')
          fullDeploy.forEach(change => {
            console.log(`        • ${change.configPath}`)
            console.log(`          File: ${change.file}`)
          })
        }
      }
    }

    // Function handlers
    if (project.functionDetails.length > 0) {
      console.log(`\n   📝  Functions (${project.functionDetails.length}):`)
      project.functionDetails.forEach(func => {
        const isChanged = project.handlerChanges.some(change =>
          change.includes(func.file)
        )
        const changeIndicator = isChanged ? '🔄' : '  '
        console.log(`      ${changeIndicator} ${func.name}: ${func.handler}`)
        if (isChanged) {
        console.log(`         File: ${func.file}`)
        }
      })
    }

    console.log()
  })

  console.log('═══════════════════════════════════════════')
  console.log('\n🔧 Recommended Actions:\n')

  changedProjects.forEach(project => {
    console.log(`   📦 ${project.name}:`)

    if (project.packageJsonChanged) {
      console.log(`      • Run: cd ${project.path} && npm install`)
    }

    if (project.handlerChanges.length > 0) {
      console.log(`      • Test ${project.handlerChanges.length} changed function(s)`)
      console.log(`      • Run: cd ${project.path} && serverless deploy`)
    }

    if (project.configChanged) {
      console.log(`      • Review serverless configuration changes`)
      console.log(`      • Validate: cd ${project.path} && serverless package`)
    }

    if (project.configFileRefChanged) {
      console.log(`      • Review config file reference changes`)
      if (project.configFileRefChanges.modified.length > 0) {
        console.log(`        Modified: ${project.configFileRefChanges.modified.join(', ')}`)
      }
      if (project.configFileRefChanges.created.length > 0) {
        console.log(`        Created: ${project.configFileRefChanges.created.join(', ')}`)
      }
      if (project.configFileRefChanges.deleted.length > 0) {
        console.log(`        Deleted: ${project.configFileRefChanges.deleted.join(', ')}`)
      }
    }

    console.log()
  })

  // Export for CI/CD pipelines
  console.log('📋 Changed projects (JSON for CI/CD):')
  console.log(JSON.stringify(changedProjects.map(p => {
    // Filter to only include handlers that have actually changed
    const changedHandlers = p.functionDetails.filter(h =>
      p.handlerChanges.some(change => change.includes(h.file))
    )

    return {
      name: p.name,
      path: p.path,
      packageJsonChanged: p.packageJsonChanged,
      configChanged: p.configChanged,
      configFileRefChanged: p.configFileRefChanged,
      functionsChanged: p.handlerChanges.length,
      changedFunctions: changedHandlers.map(h => h.name),
      handlers: changedHandlers,
      configFileRefChanges: p.configFileRefChanges,
      deploymentStrategy: p.deploymentStrategy
    }
  }), null, 2))
}

/**
 * Find all directories containing serverless configuration files
 */
async function findServerlessDirectories(repoDir) {
  const serverlessConfigPatterns = [
    'serverless.yml',
    'serverless.yaml',
    'serverless.ts',
    'serverless.js'
  ]

  const directories = new Set()

  function searchDirectory(dir) {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true })

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)

        // Skip node_modules and hidden directories
        if (entry.name === 'node_modules' || entry.name.startsWith('.')) {
          continue
        }

        if (entry.isDirectory()) {
          searchDirectory(fullPath)
        } else if (entry.isFile() && serverlessConfigPatterns.includes(entry.name)) {
          directories.add(dir)
        }
      }
    } catch (err) {
      // Skip directories we can't read
    }
  }

  searchDirectory(repoDir)
  return Array.from(directories)
}

/**
 * Get the serverless config file path for a directory
 */
function getServerlessConfigFile(dir) {
  const configFiles = [
    'serverless.yml',
    'serverless.yaml',
    'serverless.ts',
    'serverless.js'
  ]

  for (const file of configFiles) {
    const filePath = path.join(dir, file)
    if (fs.existsSync(filePath)) {
      return filePath
    }
  }

  return null
}

/**
 * Extract function details from serverless configuration file including dependency paths
 */
async function extractFunctionDetails(configFile) {
  if (!configFile || !fs.existsSync(configFile)) {
    return { functionDetails: [], configFileRefs: [], fileGlobPatterns: [], metadata: null }
  }

  const handlers = []
  const configFileRefs = []
  const fileGlobPatterns = []
  let metadata = null
  const ext = path.extname(configFile)

  try {
    // Use configorama to parse the serverless config file
    // It handles YAML, JSON, TOML, and JS/TS files automatically
    const configDetails = await configorama(configFile, {
      returnMetadata: true
    })
    console.log('configDetails', configDetails)
    const config = configDetails.config
    metadata = configDetails.metadata
    const resolutionHistory = configDetails.resolutionHistory

    deepLog('configDetails.metadata.variables', metadata.variables)
    deepLog('configDetails.resolutionHistory', resolutionHistory)
    console.log('serverless config', config)
    console.log('serverless config.functions', config.functions)
    // Extract file references from config metadata
    if (metadata && metadata.resolvedFileRefs) {
      const parentDir = path.dirname(configFile)
      for (const fileRef of metadata.resolvedFileRefs) {
        const absolutePath = path.resolve(parentDir, fileRef)
        configFileRefs.push(absolutePath)
      }
    }

    // Also extract glob patterns for checking against created/modified files
    if (metadata && metadata.fileGlobPatterns) {
      const parentDir = path.dirname(configFile)
      for (const pattern of metadata.fileGlobPatterns) {
        fileGlobPatterns.push({ pattern, baseDir: parentDir })
      }
    }

    // Extract function handlers from the parsed config
    if (config && config.functions) {
      const functions = config.functions

      for (const [functionName, functionConfig] of Object.entries(functions)) {
        if (functionConfig && functionConfig.handler) {
          const handler = functionConfig.handler
          // Determine file extension based on config file type and handler
          const fileExt = ext === '.ts' ? '.ts' : '.js'
          const parentDir = path.dirname(configFile)
          const fileName = handler.split('.')[0] + fileExt
          const handlerPath = path.resolve(parentDir, fileName)

          // console.log('parentDir', parentDir)
          // console.log('handlerPath', handlerPath)

          // Get all dependency paths using resolveDepPaths
          let depPaths = []
          try {
            depPaths = resolveDepPaths(handlerPath, { verifyGraph: false })
            console.log('depPaths', depPaths)
          } catch (err) {
            console.log(`Warning: Could not resolve dependencies for ${handlerPath}:`, err.message)
          }

          handlers.push({
            name: functionName,
            ...(functionConfig.description ? { description: functionConfig.description } : {}),
            handler: handler,
            file: handler.split('.')[0] + fileExt, // Approximate file path
            dependencies: depPaths
          })
        }
      }
    }
  } catch (err) {
    console.error(`Error parsing ${configFile}:`, err.message)
  }

  return { functionDetails: handlers, configFileRefs, fileGlobPatterns, metadata }
}

// Run the detection
detectServerlessChanges()
