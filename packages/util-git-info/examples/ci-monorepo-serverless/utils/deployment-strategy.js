// Deployment strategy classification for Serverless Framework changes
const crypto = require('crypto')

/**
 * Deployment strategy rules
 * Maps config change paths to the type of deployment required
 *
 * Deployment types:
 * 1. fastSdkUpdate: Can be updated via AWS SDK UpdateFunctionConfiguration call (~5 seconds)
 *    - Environment variables, memory, timeout, layers, VPC, tracing, etc.
 *    - Changes Lambda config without redeploying code
 *
 * 2. functionDeploy (codeDeploy): Uses `sls deploy function -f <name>` (~15-30 seconds)
 *    - Code or dependency changes (codeHash or dependenciesHash changed)
 *    - Redeploys only the specific function's code package
 *
 * 3. fullDeploy: Requires full CloudFormation stack update via `sls deploy` (~60+ seconds)
 *    - Event configuration, handler/runtime changes, IAM changes, provider/service config
 *    - Updates entire CloudFormation stack and all related resources
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
    'provider',                         // Provider-level changes
    'provider.*',                       // Provider-level changes
    'service',                          // Service-level changes
    'service.*',                        // Service-level changes
    'resources',                        // CloudFormation resources
    'resources.*',                      // CloudFormation resource changes
  ]
}

/**
 * Match a change path against a pattern with wildcards
 * @param {string} path - The actual change path (e.g., "functions.hello.environment.API_KEY")
 * @param {string} pattern - The pattern to match (e.g., "functions.*.environment.*")
 * @returns {boolean} - True if the path matches the pattern
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
 * @param {string} changePath - The path of the changed config (e.g., "functions.hello.environment.API_KEY")
 * @returns {string} - Deployment strategy: 'fastSdkUpdate', 'fullDeploy', or 'unknown'
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
 * Create a hash of an object for comparison
 * @param {any} data - Data to hash
 * @returns {string} - Hex hash string
 */
function createHash(data) {
  const str = typeof data === 'string' ? data : JSON.stringify(data)
  return crypto.createHash('sha256').update(str).digest('hex')
}

/**
 * Normalize HTTP path by removing trailing slash (unless it's just "/")
 * @param {string} path - HTTP path
 * @returns {string} - Normalized path
 */
function normalizeHttpPath(path) {
  if (!path || typeof path !== 'string') return path
  if (path === '/') return path
  return path.replace(/\/$/, '')
}

/**
 * Normalize events by removing dynamic IDs and other computed values
 * @param {Array} events - Events array
 * @returns {Array} - Normalized events
 */
function normalizeEvents(events) {
  if (!events || !Array.isArray(events)) {
    return []
  }

  return events.map(event => {
    const eventCopy = JSON.parse(JSON.stringify(event))

    // For HTTP events, only keep the essential properties
    if (eventCopy.http && typeof eventCopy.http === 'object') {
      return {
        http: {
          path: normalizeHttpPath(eventCopy.http.path),
          method: eventCopy.http.method,
          cors: eventCopy.http.cors,
          private: eventCopy.http.private,
        }
      }
    }

    // For HTTP API events, only keep the essential properties
    if (eventCopy.httpApi && typeof eventCopy.httpApi === 'object') {
      return {
        httpApi: {
          path: normalizeHttpPath(eventCopy.httpApi.path),
          method: eventCopy.httpApi.method,
        }
      }
    }

    // For other event types, keep them but remove known dynamic properties
    const cleaned = { ...eventCopy }
    delete cleaned.functionName
    delete cleaned.uuid

    return cleaned
  })
}

/**
 * Remove undefined, null, empty values, and AWS Lambda default values from an object
 * @param {object} obj - Object to clean
 * @returns {object} - Cleaned object
 */
function removeEmptyValues(obj) {
  const defaults = {
    timeout: 6,
    memorySize: 1024
  }

  const cleaned = {}
  for (const key in obj) {
    const value = obj[key]

    if (value === undefined || value === null) continue
    if (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0) continue
    if (Array.isArray(value) && value.length === 0) continue
    if (value === '') continue
    if (key in defaults && value === defaults[key]) continue

    cleaned[key] = value
  }
  return cleaned
}

/**
 * Hash function configuration (including env vars, events, layers, etc.)
 * @param {object} functionConfig - Function configuration from serverless config
 * @param {object} serviceConfig - Service-level configuration
 * @returns {string} - Hex hash string
 */
function hashFunctionConfig(functionConfig, serviceConfig = {}) {
  const providerData = serviceConfig.provider || {}

  const relevantConfig = {
    handler: functionConfig.handler,
    runtime: functionConfig.runtime || providerData.runtime,
    memorySize: functionConfig.memorySize || providerData.memorySize,
    timeout: functionConfig.timeout || providerData.timeout,
    environment: {
      ...((providerData.environment) || {}),
      ...((functionConfig.environment) || {}),
      ...((functionConfig.env) || {})
    },
    layers: functionConfig.layers,
    events: normalizeEvents(functionConfig.events),
    vpc: functionConfig.vpc || providerData.vpc,
    role: functionConfig.role,
    iamRoleStatements: functionConfig.iamRoleStatements,
    reservedConcurrency: functionConfig.reservedConcurrency,
    provisionedConcurrency: functionConfig.provisionedConcurrency,
    tracing: functionConfig.tracing || providerData.tracing,
    tags: {
      ...(providerData.tags || {}),
      ...(functionConfig.tags || {})
    }
  }

  const normalized = removeEmptyValues(relevantConfig)
  return createHash(normalized)
}

/**
 * Hash service-level configuration
 * @param {object} serviceConfig - Serverless service configuration
 * @returns {string} - Hex hash string
 */
function hashServiceConfig(serviceConfig) {
  const relevantConfig = {
    service: serviceConfig.service,
    provider: {
      name: serviceConfig.provider?.name,
      runtime: serviceConfig.provider?.runtime,
      stage: serviceConfig.provider?.stage,
      region: serviceConfig.provider?.region,
      memorySize: serviceConfig.provider?.memorySize,
      timeout: serviceConfig.provider?.timeout,
      environment: serviceConfig.provider?.environment,
      vpc: serviceConfig.provider?.vpc,
      tracing: serviceConfig.provider?.tracing,
      tags: serviceConfig.provider?.tags,
      stackTags: serviceConfig.provider?.stackTags,
      iamRoleStatements: serviceConfig.provider?.iamRoleStatements,
    },
    package: serviceConfig.package ? {
      individually: serviceConfig.package.individually,
      patterns: serviceConfig.package.patterns,
      excludeDevDependencies: serviceConfig.package.excludeDevDependencies,
    } : undefined,
    resources: serviceConfig.resources ? {
      hasResources: Object.keys(serviceConfig.resources.Resources || {}).sort()
    } : undefined
  }

  const normalized = removeEmptyValues(relevantConfig)
  if (normalized.provider) {
    normalized.provider = removeEmptyValues(normalized.provider)
  }

  return createHash(normalized)
}

module.exports = {
  deploymentStrategyRules,
  matchesPathPattern,
  getDeploymentStrategy,
  createHash,
  normalizeHttpPath,
  normalizeEvents,
  removeEmptyValues,
  hashFunctionConfig,
  hashServiceConfig
}
