const path = require('path')
const fs = require('fs')
const configorama = require('configorama')
const { gitDetails } = require('../../src')
const { extractDeps } = require('@davidwells/extract-deps')
const { resolveDepPaths } = require('@davidwells/extract-deps/dep-graph')
const { getFormattedDiff } = require('../../src/git/getDiffFormatted')
const { analyzeConfigChanges } = require('./utils/config-diff')
const { categorizeConfigFileRefChanges } = require('./utils/file-ref-categorizer')
const { deepLog } = require('./utils/deep-log')

function displayGitDiff({ filePath, gitInfo }) {
  return getFormattedDiff({
    filePath,
    gitRootDir: gitInfo.dir,
    leftMargin: 4
  })
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

  // console.log('gitInfo', gitInfo)

  console.log('⚡ Serverless Monorepo Change Detection\n')
  console.log('═══════════════════════════════════════════\n')

  // Find all serverless config files using fileMatch
  const serverlessConfigsGitInfo = gitInfo.fileMatch([
    '**/serverless.yml',
    '**/serverless.yaml',
    '**/serverless.ts',
    '**/serverless.js'
  ])

  // console.log('serverlessConfigsGitInfo',)

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


  console.log('gitInfo.dir', gitInfo.dir)

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
    const {
      functionDetails,
      configFileRefs,
      fileGlobPatterns,
      metadata,
      currentConfig
    } = await extractFunctionDetails(configFile)

    //*
    console.log('functionDetails', functionDetails)
    console.log('configFileRefs', configFileRefs)
    console.log('fileGlobPatterns', fileGlobPatterns)
    /** */

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
    const categorizedChanges = categorizeConfigFileRefChanges(
      configFileRefChanges,
      metadata,
      gitInfo,
      configFile,
    )
    console.log('categorizedChanges', categorizedChanges)

    // If the serverless config file itself changed, analyze WHAT changed
    let configDiff = null
    if (configChanges.length > 0 && currentConfig) {
      // Try to get previous version of config file for comparison
      const configFilePath = path.relative(gitInfo.dir, configFile)

      try {
        // Get previous version of config file from git
        const { execSync } = require('child_process')
        const prevSlsConfigText = execSync(`git show HEAD:${configFilePath}`, {
          cwd: gitInfo.dir,
          encoding: 'utf8'
        })
        // console.log('prevSlsConfigText', prevSlsConfigText)
        // process.exit(1)

        // Write previous config to temp file next to the original config
        // This ensures relative ${file(...)} references can still resolve
        const ext = path.extname(configFile)
        const configDir = path.dirname(configFile)
        const tmpFile = path.join(configDir, `.serverless-prev-${Date.now()}${ext}`)
        fs.writeFileSync(tmpFile, prevSlsConfigText)

        const previousDetails = await configorama(tmpFile, {
          // returnMetadata: true,
          returnPreResolvedVariableDetails: true
        })
        console.log(
          `previousDetails.fileDependencies.byConfigPath ${configFilePath}`,
          previousDetails.fileDependencies.byConfigPath
        )
        console.log(
          `previousDetails.fileDependencies.references ${configFilePath}`,
          previousDetails.fileDependencies.references[0]
        )
        // process.exit(1)

        // Also checkout previous versions of any config file refs (like env.yml)
        // so configorama can resolve ${file(...)} references from the old commit
        const tmpRefFiles = []
        if (configFileRefChanges.length > 0) {
          for (const refFileRelative of configFileRefChanges) {
            try {
              const previousRefContent = execSync(`git show HEAD:${refFileRelative}`, {
                cwd: gitInfo.dir,
                encoding: 'utf8'
              })

              console.log('previousRefContent', previousRefContent)

              // Convert to absolute path for writing temp file
              const refFileAbsolute = path.join(gitInfo.dir, refFileRelative)
              const refFileDir = path.dirname(refFileAbsolute)
              const refFileName = path.basename(refFileAbsolute)
              const refFileExt = path.extname(refFileName)
              const refFileBase = refFileName.slice(0, -refFileExt.length)
              // Keep extension at end so configorama can parse the file
              const tmpRefFile = path.join(refFileDir, `${refFileBase}-prev-${Date.now()}${refFileExt}`)
              console.log('tmpRefFile', tmpRefFile)
              fs.writeFileSync(tmpRefFile, previousRefContent)

              tmpRefFiles.push({
                tmpPath: tmpRefFile,
                originalPath: refFileAbsolute,
                originalFileName: refFileName,
                tmpFileName: path.basename(tmpRefFile),
              })
            } catch (refError) {
              // Ref file might not exist in previous commit (newly created)
              console.log(`  Could not get previous version of ${refFileRelative}:`, refError.message)
            }
          }
        }

        // Build filePathOverrides map for configorama
        const filePathOverrides = {}
        for (const { originalFileName, tmpFileName } of tmpRefFiles) {
          filePathOverrides[`./${originalFileName}`] = `./${tmpFileName}`
        }
        console.log('filePathOverrides', filePathOverrides)

        let previousConfig = null
        let currentConfig = null

        try {
          // Try to parse with configorama to get resolved configs
          try {
            const previousDetails = await configorama(tmpFile, {
              returnMetadata: true,
              ignoreUnresolved: true,
              filePathOverrides
            })
            const currentDetails = await configorama(configFile, { returnMetadata: true })
            // Use resolved config for comparison
            previousConfig = previousDetails.config
            currentConfig = currentDetails.config

            deepLog('previousConfig resolved', previousConfig)
          } catch (configoramaError) {
            console.log('configoramaError', configoramaError)
            // Configorama failed (likely unresolved variable with no fallback)
            // Fall back to raw YAML/JSON parsing for YAML/JSON files
            if (ext === '.yml' || ext === '.yaml') {
              const yaml = require('js-yaml')
              previousConfig = yaml.load(prevSlsConfigText)
              const currentConfigContent = fs.readFileSync(configFile, 'utf8')
              currentConfig = yaml.load(currentConfigContent)
            } else if (ext === '.json') {
              previousConfig = JSON.parse(prevSlsConfigText)
              const currentConfigContent = fs.readFileSync(configFile, 'utf8')
              currentConfig = JSON.parse(currentConfigContent)
            } else {
              // For JS/TS files, we need configorama - can't fall back
              throw configoramaError
            }
          }
        } finally {
          // Clean up temp files
          if (fs.existsSync(tmpFile)) {
            fs.unlinkSync(tmpFile)
          }
          for (const { tmpPath } of tmpRefFiles) {
            if (fs.existsSync(tmpPath)) {
              fs.unlinkSync(tmpPath)
            }
          }
        }

        if (previousConfig && currentConfig) {
          // Compare the unresolved configs
          configDiff = analyzeConfigChanges(previousConfig, currentConfig)
          console.log('configDiff', configDiff)

          // Merge into categorizedChanges
          if (configDiff.fastSdkUpdate.length > 0) {
            categorizedChanges.fastSdkUpdate.push(...configDiff.fastSdkUpdate)
          }
          if (configDiff.fullDeploy.length > 0) {
            categorizedChanges.fullDeploy.push(...configDiff.fullDeploy)
          }
          if (configDiff.unknown.length > 0) {
            categorizedChanges.unknown.push(...configDiff.unknown)
          }
        } else {
          // Couldn't parse configs
          categorizedChanges.fullDeploy.push({
            file: configFilePath,
            type: 'parseFail',
            strategy: 'fullDeploy',
            reason: 'Serverless configuration file changed (could not parse)',

          })
        }
      } catch (error) {
        // Couldn't get/parse previous version - default to fullDeploy
        console.log('  Could not analyze config diff:', error.message)
        categorizedChanges.fullDeploy.push({
          file: configFilePath,
          type: 'parseFail',
          strategy: 'fullDeploy',
          reason: 'Serverless configuration file changed (new or could not get previous version)',
        })
      }
    }

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
      configChangedFiles: configChanges.map(f => path.relative(projectPath, f)),
      configDiff,
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

  // console.log('changedProjects', changedProjects)

  if (changedProjects.length === 0) {
    console.log('✅ No serverless projects have changed')
    return
  }

  console.log(`🎯 ${changedProjects.length} serverless project(s) changed:\n`)

  // Display detailed information for each changed project
  for (let index = 0; index < changedProjects.length; index++) {
    const project = changedProjects[index]
    console.log('─────────────────────────────────────────────────────────────────────────────────────────────')
    console.log(`\n${index + 1}. ☁️ ${project.name}`)
    console.log(`   Path: ${project.path}`)
    console.log(`   Config: ${project.configFile}`)

    // Function handlers
    // if (project.functionDetails.length > 0) {
    // console.log(`   Functions (${project.functionDetails.length}):`)
    //   project.functionDetails.forEach(func => {
    //     const isChanged = project.handlerChanges.some(change =>
    //       change.includes(func.file)
    //     )
    //     const changeIndicator = isChanged ? '(Updated)' : ''
    //     console.log(`     • ${func.name}: ${func.handler} ${changeIndicator}`)
    //   })
    // }
    // console.log()

    console.log(`   Files changed: ${project.totalChanges}\n`)

    // Modified files
    if (project.changes.modified.length > 0) {
      console.log(`    • ${project.changes.modified.length} modified`)
      project.changes.modified.forEach(file => {
        console.log(`     - ${path.relative(project.path, file)}`)
      })
    }

    // Created files
    if (project.changes.created.length > 0) {
      console.log(`    • ${project.changes.created.length} created`)
      project.changes.created.forEach(file => {
        console.log(`     - ${path.relative(project.path, file)}`)
      })
    }

    // Deleted files
    if (project.changes.deleted.length > 0) {
      console.log(`    • ${project.changes.deleted.length} deleted`)
      project.changes.deleted.forEach(file => {
        console.log(`     - ${path.relative(project.path, file)}`)
      })
    }

    console.log()

    // Important changes
    if (project.packageJsonChanged) {
      console.log('   📝  Dependencies changed (package.json)')
    }
    if (project.configChanged) {
      console.log(`   📝  ${path.basename(project.configFile)} configuration changed\n`)

      // Show formatted diff for serverless config
      const formattedDiff = await displayGitDiff({
        filePath: project.configFile,
        gitInfo,
      })
      if (formattedDiff) {
        console.log(formattedDiff)
      }
    }
    if (project.configFileRefChanged) {
      console.log('   📝  Config file references changed')
      if (project.configFileRefChanges.modified.length > 0) {
        console.log('       Modified:', project.configFileRefChanges.modified.join(', '))
        console.log()
        for (const file of project.configFileRefChanges.modified) {
          // Show formatted diff for modified config file reference
          const filePath = path.join(project.path, file)
          const formattedDiff = await displayGitDiff({
            filePath,
            gitInfo,
          })
          if (formattedDiff) {
            console.log(formattedDiff)
          }
        }
      }
      if (project.configFileRefChanges.created.length > 0) {
        console.log('       Created:', project.configFileRefChanges.created.join(', '))
        console.log()
        for (const file of project.configFileRefChanges.created) {
          // Show formatted diff for created config file reference
          const filePath = path.join(project.path, file)
          const formattedDiff = await displayGitDiff({
            filePath,
            gitInfo,
          })
          if (formattedDiff) {
            console.log(formattedDiff)
          }
        }
      }
      if (project.configFileRefChanges.deleted.length > 0) {
        console.log('       Deleted:', project.configFileRefChanges.deleted.join(', '))
        console.log()
      }

      // // Show deployment strategy analysis
      // if (project.deploymentStrategy) {
      //   const { fastSdkUpdate, fullDeploy } = project.deploymentStrategy
      //   if (fastSdkUpdate.length > 0) {
      //     console.log('\n   ⚡ Fast SDK Update Required (~5 seconds):')
      //     fastSdkUpdate.forEach(change => {
      //       console.log(`        • ${change.configPath}`)
      //       console.log(`          File: ${change.file}`)
      //     })
      //   }
      //   if (fullDeploy.length > 0) {
      //     console.log('\n   🚀 Full Deploy Required (~60+ seconds):')
      //     fullDeploy.forEach(change => {
      //       console.log(`        • ${change.configPath}`)
      //       console.log(`          File: ${change.file}`)
      //     })
      //   }
      // }
    }

    // Log function change details here
    const fnIndent = '   '
    if (project.handlerChanges.length > 0) {
      console.log(`\n${fnIndent}🔄 Function handler code changes:\n`)

      const shownDiffs = new Set()

      for (const func of project.functionDetails) {
        const handlerChanged = project.handlerChanges.some(change =>
          change.includes(func.file)
        )

        // Check for changed dependencies
        const changedDeps = []
        if (func.dependencies && func.dependencies.length > 0) {
          for (const dep of func.dependencies) {
            const relativeDep = path.relative(gitInfo.dir, dep)
            const isDepChanged = project.changes.modified.some(file =>
              file === relativeDep || file.includes(relativeDep)
            )
            if (isDepChanged) {
              changedDeps.push(relativeDep)
            }
          }
        }

        const hasChanges = handlerChanged || changedDeps.length > 0



        if (hasChanges) {
          console.log(`${fnIndent} ${func.name}: ${func.handler}`)

          // Show formatted diff for changed handler file
          let functionThePath
          if (handlerChanged) {
            functionThePath = path.join(project.path, func.file)
            const normalizedPath = path.relative(gitInfo.dir, functionThePath)

            if (!shownDiffs.has(normalizedPath)) {
              const formattedDiff = await displayGitDiff({
                filePath: functionThePath,
                gitInfo,
              })
              if (formattedDiff) {
                console.log(formattedDiff)
                shownDiffs.add(normalizedPath)
              }
            }
          }

          const cleanDeps = changedDeps.filter(dep => dep !== functionThePath)

          // Show formatted diffs for changed dependencies
          for (const dep of cleanDeps) {
            if (!shownDiffs.has(dep)) {
              console.log(`\n${fnIndent} Dependency file changed:`)
              const formattedDiff = await displayGitDiff({ filePath: dep, gitInfo })
              if (formattedDiff) console.log(formattedDiff)
              shownDiffs.add(dep)
            }
          }
        }
      }
    }

    console.log()
  }

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
    // Filter to only include handlers that have actually changed (file or dependencies)
    const changedHandlers = p.functionDetails.filter(h => {
      // Check if handler file itself changed
      const handlerChanged = p.handlerChanges.some(change => change.includes(h.file))
      if (handlerChanged) return true

      // Check if any dependency changed
      if (h.dependencies && h.dependencies.length > 0) {
        const depChanged = h.dependencies.some(dep => {
          // dep is absolute, handlerChanges are relative to project
          // Check path boundary to avoid false positives (e.g. foobar.js matching bar.js)
          return p.handlerChanges.some(change =>
            dep.endsWith('/' + change) || dep.endsWith(path.sep + change)
          )
        })
        if (depChanged) return true
      }

      return false
    })

    const hasConfigChanges = p.configChanged
    const hasConfigRefChanges = p.configFileRefChanged
    const hasFunctionChanges = p.handlerChanges.length > 0
    const hasPackageJsonChanges = p.packageJsonChanged

    const result = {
      name: p.name,
      path: p.path,
      hasConfigChanges,
      hasConfigRefChanges,
      hasFunctionChanges,
      hasPackageJsonChanges,
    }

    if (p.configChanged && p.configDiff) {
      const allDiffs = [
        ...(p.configDiff.fastSdkUpdate || []),
        ...(p.configDiff.fullDeploy || []),
        ...(p.configDiff.unknown || [])
      ]
      result.configChanges = {
        files: p.configChangedFiles,
        properties: allDiffs.map(d => d.path).filter(Boolean)
      }
    }

    if (hasConfigRefChanges) {
      result.changedConfigFileRefs = p.configFileRefChanges
    }

    if (hasFunctionChanges) {
      result.changedFunctions = changedHandlers
    }

    result.deploymentStrategies = p.deploymentStrategy

    return result
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
    return { functionDetails: [], configFileRefs: [], fileGlobPatterns: [], metadata: null, currentConfig: null }
  }

  const handlers = []
  const configFileRefs = []
  const fileGlobPatterns = []
  let metadata = null
  let config = null
  const ext = path.extname(configFile)

  try {
    // Use configorama to parse the serverless config file
    // It handles YAML, JSON, TOML, and JS/TS files automatically
    const configDetails = await configorama(configFile, {
      returnMetadata: true
    })
    // console.log('configDetails', configDetails)
    config = configDetails.config
    metadata = configDetails.metadata
    const resolutionHistory = configDetails.resolutionHistory

    /*
    deepLog('configDetails.metadata.variables', metadata.variables)
    deepLog('configDetails.resolutionHistory', resolutionHistory)
    console.log('serverless config', config)
    console.log('serverless config.functions', config.functions)
    /** */

    // Extract file references from config metadata
    // Note: configorama moved file deps under metadata.fileDependencies
    if (metadata && metadata.fileDependencies) {
      const parentDir = path.dirname(configFile)
      const fileDeps = metadata.fileDependencies

      // Get resolved file paths
      if (fileDeps.resolvedPaths && fileDeps.resolvedPaths.length > 0) {
        console.log('metadata.fileDependencies.resolvedPaths for', configFile, ':', fileDeps.resolvedPaths)
        for (const fileRef of fileDeps.resolvedPaths) {
          const absolutePath = path.resolve(parentDir, fileRef)
          configFileRefs.push(absolutePath)
        }
      }

      // Get glob patterns for dynamic file refs (e.g., ./env.*.yml)
      if (fileDeps.globPatterns && fileDeps.globPatterns.length > 0) {
        console.log('metadata.fileDependencies.globPatterns for', configFile, ':', fileDeps.globPatterns)
        for (const pattern of fileDeps.globPatterns) {
          fileGlobPatterns.push({ pattern, baseDir: parentDir })
        }
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
            //console.log('depPaths', depPaths)
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
    // fail hard if we can't parse the config file
    process.exit(1)
  }

  return { functionDetails: handlers, configFileRefs, fileGlobPatterns, metadata, currentConfig: config }
}

// Run the detection
detectServerlessChanges()
