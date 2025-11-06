const { gitDetails } = require('../src')

async function checkConfigChanges() {
  let gitInfo
  try {
    gitInfo = await gitDetails({
      base: 'master'
    })
  } catch (err) {
    console.log('Error getting git info')
    console.log(err)
    return
  }

  console.log('🔍 Checking for configuration changes...\n')

  // Check for package.json changes
  const packageJsonChanges = gitInfo.fileMatch('**/package.json')
  if (packageJsonChanges.edited) {
    console.log('📦 package.json files changed:')
    packageJsonChanges.editedFiles.forEach(file => {
      console.log(`   - ${file}`)
    })
    console.log('⚠️  Action: Review dependencies and run npm install\n')
  }

  // Check for environment/config files
  const envFiles = gitInfo.fileMatch([
    '**/.env*',
    '**/config.js',
    '**/config.json',
    '**/*.config.js'
  ])
  if (envFiles.edited) {
    console.log('⚙️  Configuration files changed:')
    envFiles.editedFiles.forEach(file => {
      console.log(`   - ${file}`)
    })
    console.log('⚠️  Action: Update environment variables and restart services\n')
  }

  // Check for Docker/CI configuration
  const infraFiles = gitInfo.fileMatch([
    '**/Dockerfile*',
    '**/.gitlab-ci.yml',
    '**/.github/workflows/**',
    '**/docker-compose.yml'
  ])
  if (infraFiles.edited) {
    console.log('🐳 Infrastructure files changed:')
    infraFiles.editedFiles.forEach(file => {
      console.log(`   - ${file}`)
    })
    console.log('⚠️  Action: Review deployment pipeline changes\n')
  }

  // Check for build configuration
  const buildFiles = gitInfo.fileMatch([
    '**/webpack.config.js',
    '**/vite.config.js',
    '**/tsconfig.json',
    '**/babel.config.js',
    '**/.babelrc*'
  ])
  if (buildFiles.edited) {
    console.log('🔨 Build configuration changed:')
    buildFiles.editedFiles.forEach(file => {
      console.log(`   - ${file}`)
    })
    console.log('⚠️  Action: Rebuild project and test\n')
  }

  const hasConfigChanges = packageJsonChanges.edited ||
                          envFiles.edited ||
                          infraFiles.edited ||
                          buildFiles.edited

  if (!hasConfigChanges) {
    console.log('✅ No configuration files changed')
  }
}

checkConfigChanges()
