const path = require('path')
const fs = require('fs')
const configorama = require('configorama')
const { gitDetails } = require('../src')
const { extractDeps } = require('@davidwells/extract-deps')
const { depGraph } = require('@davidwells/extract-deps/dep-graph')

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

    // Extract function handlers from the serverless config
    const functionHandlers = await extractFunctionHandlers(configFile)

    console.log('functionHandlers', functionHandlers)

    // Detect changes to function handler files
    const handlerChanges = projectChanges.filter(file => {
      return functionHandlers.some(handler => {
        const handlerPath = handler.file.replace(/\\/g, '/')
        return file.includes(handlerPath) || file.startsWith(path.join(projectPath, handlerPath))
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
      functionHandlers,
      handlerChanges: handlerChanges.map(f => path.relative(projectPath, f))
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
    console.log(`   Config: ${project.configFile}`)
    console.log(`   Files changed: ${project.totalChanges}`)
    console.log(`   • ${project.changes.modified.length} modified`)
    console.log(`   • ${project.changes.created.length} created`)
    console.log(`   • ${project.changes.deleted.length} deleted`)
    console.log()

    // Important changes
    if (project.packageJsonChanged) {
      console.log('   ⚠️  Dependencies changed (package.json)')
    }
    if (project.configChanged) {
      console.log('   ⚠️  Serverless configuration changed')
    }

    // Function handlers
    if (project.functionHandlers.length > 0) {
      console.log(`\n   📝 Functions (${project.functionHandlers.length}):`)
      project.functionHandlers.forEach(func => {
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

    console.log()
  })

  // Export for CI/CD pipelines
  console.log('📋 Changed projects (JSON for CI/CD):')
  console.log(JSON.stringify(changedProjects.map(p => {
    // Filter to only include handlers that have actually changed
    const changedHandlers = p.functionHandlers.filter(h =>
      p.handlerChanges.some(change => change.includes(h.file))
    )

    return {
      name: p.name,
      path: p.path,
      packageJsonChanged: p.packageJsonChanged,
      configChanged: p.configChanged,
      functionsChanged: p.handlerChanges.length,
      changedFunctions: changedHandlers.map(h => h.name),
      handlers: changedHandlers
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
 * Extract function handlers from serverless configuration file
 */
async function extractFunctionHandlers(configFile) {
  if (!configFile || !fs.existsSync(configFile)) {
    return []
  }

  const handlers = []
  const ext = path.extname(configFile)

  try {
    // Use configorama to parse the serverless config file
    // It handles YAML, JSON, TOML, and JS/TS files automatically
    const configDetails = await configorama(configFile, {
      returnMetadata: true
    })
    console.log('configDetails', configDetails)
    const config = configDetails.config
    const metadata = configDetails.metadata

    console.log('serverless config', config)

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
          console.log('parentDir', parentDir)
          console.log('handlerPath', handlerPath)
          const fileGraph = depGraph(handlerPath)
          console.log('fileGraph', fileGraph)
          const content = fs.readFileSync(handlerPath, 'utf8')
          const dependencies = extractDeps(content)
          console.log('dependencies', dependencies)
          handlers.push({
            name: functionName,
            ...(functionConfig.description ? { description: functionConfig.description } : {}),
            handler: handler,
            file: handler.split('.')[0] + fileExt // Approximate file path
          })
        }
      }
    }
  } catch (err) {
    console.error(`Error parsing ${configFile}:`, err.message)
  }

  return handlers
}

// Run the detection
detectServerlessChanges()
