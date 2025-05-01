# wait-for

`@davidwells/wait-for` is a flexible and powerful polling utility that allows you to wait for a condition to be met with configurable retry logic, cancellation, timeouts, and callbacks.

<!-- doc-gen TOC collapse="true" -->
<details>
<summary>Table of Contents</summary>

- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [API](#api)
  - [`waitFor(fnOrOpts, opts, callback)`](#waitforfnoropts-opts-callback)
    - [Parameters](#parameters)
    - [Options](#options)
    - [Returns](#returns)
- [Types](#types)
  - [WaitForOptions](#waitforoptions)
  - [WaitForApi](#waitforapi)
  - [WaitForResult](#waitforresult)
- [Advanced Usage](#advanced-usage)
  - [With Configuration Options](#with-configuration-options)
  - [With Abort Controller](#with-abort-controller)
  - [Short circuit](#short-circuit)
- [Use Cases Examples](#use-cases-examples)
  - [Api Health Check](#api-health-check)
  - [Cicd Pipeline](#cicd-pipeline)
  - [Configuration](#configuration)
  - [Database Connection](#database-connection)
  - [Event Driven](#event-driven)
  - [File System](#file-system)
  - [Microservices](#microservices)
  - [Queue Processing](#queue-processing)
  - [Resource Cleanup](#resource-cleanup)
  - [Test Automation](#test-automation)
- [License](#license)
- [Alternatives approaches](#alternatives-approaches)

</details>
<!-- end-doc-gen -->

## Features

- Poll a function until it returns a truthy value
- Configurable retry attempts, delays, and timeouts
- Exponential backoff with optional jitter
- Abort controller support for cancellation
- Heartbeat callbacks for monitoring progress
- onSuccess/onError/onFailure callbacks
- Promise-based API with callback support
- Error handling with retry options
- User-land settle and abort methods for controlling operation flow
- Hot-swap inflight predicate args between retries

## Installation

```bash
npm install @davidwells/wait-for
```

## Usage

As async `await`

```js
const { waitFor } = require('@davidwells/wait-for')

async function run() {
  /* Execution will "pause" and waitFor someAsyncOperation to return truthy value */
  await waitFor(() => someAsyncOperation().then(result => result.isReady))
  console.log('someAsyncOperation returned truthy value continue processesing')
}

run()
```

As promise

```javascript
const { waitFor } = require('@davidwells/wait-for')

// Simple example - wait for a condition to be true
waitFor(() => {
  return someAsyncOperation().then(result => result.isReady)
})
.then(result => {
  console.log('Condition met!', result)
})
.catch(error => {
  console.error('Operation failed:', error)
})
```

With `callback`

```js
const { waitFor } = require('@davidwells/wait-for')

const settings = {
  delay: 1000,
  timeout: 5000
}

const predicateFn = ({ attempt, retries }) => someAsyncOperation().then(result => result.isReady)

waitFor(predicateFn, settings, (err, result) => {
  if (err) {
    console.error('Callback error', err)
    return
  }
  console.log('Callback result', result)
})
```

## API

### `waitFor(fnOrOpts, opts, callback)`

#### Parameters

- `fnOrOpts`: Function to poll or options object
- `opts`: Options object (if first parameter is a function)
- `callback`: Optional callback function (err, result)

#### Options

- `predicate`: Function to poll (required if first parameter is options object)
- `args`: Arguments to pass to the predicate function
- `retryOnError`: Retry predicate function on non-native errors (default: false)
- `timeout`: Maximum time to wait in milliseconds
- `delay`: Delay between retries in milliseconds (default: 1000)
- `minDelay`: Minimum delay between retries
- `maxDelay`: Maximum delay between retries
- `exponentialBackoff`: Factor to increase delay by on each retry
- `maxRetries`: Maximum number of retries
- `jitterRange`: Random jitter range for delay (0-1)
- `abortController`: AbortController instance for cancellation
- `onHeartbeat`: Function called on each iteration with current options
- `onError`: Function called on error with error result
- `onSuccess`: Function called on successful completion with result
- `onFailure`: Function called on failure with error result
- `callback`: Function called with (error, result) on completion
- `enhanceArgs`: Whether to append config to predicate arguments

#### Returns

- Promise that resolves when condition is met or rejects on timeout/failure

## Types

### WaitForOptions

```typescript
type WaitForOptions = {
  predicate?: Function
  args?: any[]
  retryOnError?: boolean
  timeout?: number
  delay?: number
  minDelay?: number
  maxDelay?: number
  exponentialBackoff?: number
  maxRetries?: number
  onHeartbeat?: (config: WaitForApi) => void
  onError?: (config: WaitForApi) => void
  onSuccess?: (result: WaitForResult) => void
  onFailure?: (result: WaitForResult) => void
  callback?: (error: Error | null, result: WaitForResult | null) => void
  jitterRange?: number
  abortController?: AbortController
  enhanceArgs?: boolean
}
```

### WaitForApi

```typescript
type WaitForApi = WaitForOptions & {
  attempt: number
  retries: number
  elapsed: number
  message: string
  settle: Function
  abort: Function
  isAborted: boolean
  isSettled: boolean
  nextDelay?: number
  promise?: {
    resolve: (value: WaitForResult | PromiseLike<WaitForResult>) => void
    reject: (reason?: any) => void
  }
}
```

### WaitForResult

```typescript
type WaitForResult = {
  success: boolean
  value?: any
  message?: string
  error?: Error
  state: WaitForOptions
}
```

## Advanced Usage

### With Configuration Options

```javascript
const { waitFor } = require('@davidwells/wait-for')

waitFor({
  predicate: async () => {
    const result = await checkDatabaseConnection()
    return result.connected
  },
  retries: 5,
  delay: 1000, // 1 second between attempts
  timeout: 10000, // 10 seconds total timeout
  exponentialBackoff: 1.5, // Increase delay by 50% each retry
  maxDelay: 5000, // Maximum delay of 5 seconds
  jitterRange: 0.25, // Add random jitter to avoid thundering herd
  onHeartbeat: (settings) => {
    console.log(`Attempt ${settings.retries + 1}/${settings.attempt}`)
  },
  onSuccess: (result) => {
    console.log('Success!', result)
  },
  onFailure: (error) => {
    console.log('Failed:', error)
  }
})
```

### With Abort Controller

```javascript
const { waitFor } = require('@davidwells/wait-for')

// Create an abort controller
const controller = new AbortController()

// Start the wait operation
const waitPromise = waitFor({
  predicate: async () => {
    const result = await checkService()
    return result.isAvailable
  },
  abortController: controller,
  delay: 500,
  timeout: 5000
})

// Abort the operation after 2 seconds
setTimeout(() => {
  controller.abort('Operation timed out by user')
}, 2000)

// Handle the result
waitPromise
  .then(result => console.log('Service is available:', result))
  .catch(error => console.error('Operation failed:', error))
```

### Short circuit

This example shows how you can short circuit waitFor early with `settle` or `abort`

```javascript
const { waitFor } = require('@davidwells/wait-for')

let counter = 0

waitFor({
  predicate: () => {
    counter++
    console.log(`Predicate called ${counter} times`)
    return counter >= 5
  },
  delay: 200,
  onHeartbeat: ({ settle, attempt }) => {
    console.log(`Heartbeat: Attempt ${attempt}`)
    // Settle after 2 attempts with a custom value
    if (attempt >= 2) {
      console.log('Settling from heartbeat callback')
      settle({ message: 'Settled early from callback', attempts: attempt })
    }
  }
})
```

## Use Cases Examples

Here are some practical use cases for wait-for, with detailed examples in the [examples/use-cases](examples/use-cases) directory:

- [Database Connection](https://github.com/DavidWells/packages/blob/master/packages/wait-for/examples/use-cases/database-connection.js) - Waiting for database to be ready
- [File System](https://github.com/DavidWells/packages/blob/master/packages/wait-for/examples/use-cases/file-system.js) - Waiting for file system operations
- [API Health Check](https://github.com/DavidWells/packages/blob/master/packages/wait-for/examples/use-cases/api-health-check.js) - Checking API health status
- [Test Automation](https://github.com/DavidWells/packages/blob/master/packages/wait-for/examples/use-cases/test-automation.js) - Waiting for UI elements in tests
- [CI/CD Pipeline](https://github.com/DavidWells/packages/blob/master/packages/wait-for/examples/use-cases/cicd-pipeline.js) - Monitoring deployment status
- [Resource Cleanup](https://github.com/DavidWells/packages/blob/master/packages/wait-for/examples/use-cases/resource-cleanup.js) - Waiting for resources to be released
- [Event-Driven Systems](https://github.com/DavidWells/packages/blob/master/packages/wait-for/examples/use-cases/event-driven.js) - Waiting for event processing
- [Microservices](https://github.com/DavidWells/packages/blob/master/packages/wait-for/examples/use-cases/microservices.js) - Coordinating between microservices
- [Configuration](https://github.com/DavidWells/packages/blob/master/packages/wait-for/examples/use-cases/configuration.js) - Waiting for configuration loading
- [Queue Processing](https://github.com/DavidWells/packages/blob/master/packages/wait-for/examples/use-cases/queue-processing.js) - Waiting for queue to be empty

<!-- doc-gen {USE_CASES} -->
### Api Health Check

This example demonstrates how to use wait-for to check the health of an external API
before proceeding with application startup.

```javascript
const { waitFor } = require('@davidwells/wait-for')

// Mock API client for example
class MockAPIClient {
  constructor() {
    this.healthy = false
  }

  async start() {
    // Simulate API startup
    await new Promise(resolve => setTimeout(resolve, 1000))
    this.healthy = true
    return this
  }

  async checkHealth() {
    if (!this.healthy) {
      throw new Error('API is not healthy')
    }
    return { status: 'healthy' }
  }
}

async function run() {
  console.log('Starting API health check...')
  
  const api = new MockAPIClient()
  
  // Start API in background
  api.start().catch(console.error)
  
  try {
    // Wait for API to be healthy
    const result = await waitFor({
      predicate: async () => {
        try {
          const response = await api.checkHealth()
          return response.status === 'healthy'
        } catch (err) {
          return false
        }
      },
      delay: 1000,
      maxRetries: 10,
      onHeartbeat: (config) => {
        console.log(`Checking API health... Attempt ${config.attempt}`)
      },
      onSuccess: () => {
        console.log('API is healthy!')
      },
      onFailure: (error) => {
        console.error('API health check failed:', error.message)
      }
    })
    
    console.log('API health check result:', result)
    return result
  } catch (error) {
    console.error('API health check failed:', error)
  }
}
```

### Cicd Pipeline

This example demonstrates how to use wait-for to monitor deployment status
in a CI/CD pipeline.

```javascript
const { waitFor } = require('@davidwells/wait-for')

// Mock deployment service for example
class MockDeploymentService {
  constructor() {
    this.deployments = new Map()
  }

  async startDeployment(id) {
    // Simulate deployment process
    await new Promise(resolve => setTimeout(resolve, 1000))
    this.deployments.set(id, 'COMPLETED')
    return { id, status: 'COMPLETED' }
  }

  async checkDeploymentStatus(id) {
    const status = this.deployments.get(id) || 'IN_PROGRESS'
    return { id, status }
  }
}

async function run() {
  console.log('Starting CI/CD pipeline example...')
  
  const deploymentService = new MockDeploymentService()
  const deploymentId = 'deploy-123'
  
  // Start deployment in background
  deploymentService.startDeployment(deploymentId).catch(console.error)
  
  try {
    // Wait for deployment to complete
    const result = await waitFor({
      predicate: async () => {
        const status = await deploymentService.checkDeploymentStatus(deploymentId)
        if (status.status === 'COMPLETED') {
          return status
        }
      },
      delay: 1000,
      exponentialBackoff: 1.5,
      onHeartbeat: (config) => {
        console.log(`Checking deployment status... Attempt ${config.attempt}`)
      },
      onSuccess: () => {
        console.log('Deployment completed successfully!')
      },
      onFailure: (error) => {
        console.error('Deployment failed:', error.message)
      }
    })
    
    console.log('Deployment result:', result.value)
    return result
  } catch (error) {
    console.error('CI/CD pipeline check failed:', error)
    return false
  }
}
```

### Configuration

This example demonstrates how to use wait-for to wait for
configuration to be loaded before starting an application.

```javascript
const { waitFor } = require('@davidwells/wait-for')

// Mock configuration service for example
class MockConfigService {
  constructor() {
    this.config = {}
    this.ready = false
  }

  async loadConfig() {
    // Simulate config loading
    await new Promise(resolve => setTimeout(resolve, 1000))
    this.config = {
      apiKey: 'test-key',
      environment: 'development',
      timeout: 5000
    }
    this.ready = true
    return this.config
  }

  isReady() {
    return this.ready
  }

  getConfig() {
    return this.config
  }
}

async function run() {
  console.log('Starting configuration loading example...')
  
  const configService = new MockConfigService()
  
  // Start config loading in background
  configService.loadConfig().catch(console.error)
  
  try {
    // Wait for config to be ready
    const result = await waitFor({
      predicate: () => configService.isReady(),
      delay: 1000,
      onHeartbeat: (config) => {
        console.log(`Waiting for configuration... Attempt ${config.attempt}`)
      },
      onSuccess: () => {
        console.log('Configuration loaded successfully!')
      },
      onFailure: (error) => {
        console.error('Configuration loading failed:', error.message)
      }
    })
    
    console.log('Configuration result:', result)
    console.log('Loaded config:', configService.getConfig())
    return result
  } catch (error) {
    console.error('Configuration loading failed:', error)
  }
}
```

### Database Connection

This example demonstrates how to use wait-for to wait for a database connection
to be ready before starting an application.

```javascript
const { waitFor } = require('@davidwells/wait-for')

// Mock database client for example
class MockDatabase {
  constructor() {
    this.connected = false
  }

  async connect() {
    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    this.connected = true
    return this
  }

  async ping() {
    if (!this.connected) {
      throw new Error('Not connected')
    }
    return { status: 'ok' }
  }
}

async function run() {
  console.log('Starting database connection test...')
  
  const db = new MockDatabase()
  
  // Start connection in background
  db.connect().catch(console.error)
  
  try {
    // Wait for database to be ready
    const result = await waitFor({
      predicate: async () => {
        try {
          await db.ping()
          return true
        } catch (err) {
          return false
        }
      },
      delay: 1000,
      timeout: 30000,
      onHeartbeat: (config) => {
        console.log(`Waiting for database... Attempt ${config.attempt}`)
      },
      onSuccess: () => {
        console.log('Database connection established!')
      },
      onFailure: (error) => {
        console.error('Failed to connect to database:', error.message)
      }
    })
    
    console.log('Database is ready:', result)
    return result
  } catch (error) {
    console.error('Database connection test failed:', error)
  }
}
```

### Event Driven

This example demonstrates how to use wait-for to wait for events
to be processed in an event-driven system.

```javascript
const { waitFor } = require('@davidwells/wait-for')

// Mock event processor for example
class MockEventProcessor {
  constructor() {
    this.events = new Map()
    this.processing = false
  }

  async processEvent(id) {
    // Simulate event processing
    await new Promise(resolve => setTimeout(resolve, 1000))
    this.events.set(id, 'PROCESSED')
    return { id, status: 'PROCESSED' }
  }

  async checkEventStatus(id) {
    const status = this.events.get(id) || 'PENDING'
    return { id, status }
  }
}

async function run() {
  console.log('Starting event-driven systems example...')
  
  const eventProcessor = new MockEventProcessor()
  const eventId = 'event-123'
  
  // Start event processing in background
  eventProcessor.processEvent(eventId).catch(console.error)
  
  try {
    // Wait for event to be processed
    const result = await waitFor({
      predicate: async () => {
        const event = await eventProcessor.checkEventStatus(eventId)
        return event.status === 'PROCESSED'
      },
      delay: 1000,
      jitterRange: 0.2, // Add randomness to avoid thundering herd
      onHeartbeat: (config) => {
        console.log(`Checking event status... Attempt ${config.attempt}`)
      },
      onSuccess: () => {
        console.log('Event processed successfully!')
      },
      onFailure: (error) => {
        console.error('Event processing failed:', error.message)
      }
    })
    
    console.log('Event processing result:', result)
    return result
  } catch (error) {
    console.error('Event-driven system check failed:', error)
  }
}
```

### File System

This example demonstrates how to use wait-for to wait for file system operations
to complete, such as waiting for a file to be created or modified.

```javascript
const fs = require('fs')
const path = require('path')
const { waitFor } = require('@davidwells/wait-for')

// Mock file creator for example
class FileCreator {
  constructor(filePath) {
    this.filePath = filePath
    this.created = false
  }

  async createFile() {
    // Simulate file creation delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    fs.writeFileSync(this.filePath, 'Hello, World!')
    this.created = true
    return this.filePath
  }
}

async function run() {
  console.log('Starting file system operations test...')
  
  const tempDir = path.join(__dirname, 'temp')
  const filePath = path.join(tempDir, 'test.txt')
  
  // Create temp directory if it doesn't exist
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir)
  }
  
  const creator = new FileCreator(filePath)
  
  // Start file creation in background
  creator.createFile().catch(console.error)
  
  try {
    // Wait for file to be created
    const result = await waitFor({
      predicate: () => fs.existsSync(filePath),
      delay: 1000,
      timeout: 10000,
      onHeartbeat: (config) => {
        console.log(`Waiting for file... Attempt ${config.attempt}`)
      },
      onSuccess: () => {
        console.log('File created successfully!')
      },
      onFailure: (error) => {
        console.error('Failed to create file:', error.message)
      }
    })
    
    console.log('File is ready:', result)
    
    // Clean up
    fs.unlinkSync(filePath)
    fs.rmdirSync(tempDir)
    return result
  } catch (error) {
    console.error('File system operation failed:', error)
    // Clean up on failure
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }
    if (fs.existsSync(tempDir)) {
      fs.rmdirSync(tempDir)
    }
  }
}
```

### Microservices

This example demonstrates how to use wait-for to coordinate
between microservices, such as waiting for a dependent service
to be ready.

```javascript
const { waitFor } = require('@davidwells/wait-for')

// Mock service registry for example
class MockServiceRegistry {
  constructor() {
    this.services = new Map()
  }

  async registerService(name) {
    // Simulate service startup
    await new Promise(resolve => setTimeout(resolve, 1000))
    this.services.set(name, 'UP')
    return { name, status: 'UP' }
  }

  async checkServiceHealth(name) {
    const status = this.services.get(name) || 'STARTING'
    return { name, status }
  }
}

async function run() {
  console.log('Starting microservices coordination example...')
  
  const serviceRegistry = new MockServiceRegistry()
  const serviceName = 'user-service'
  
  // Start service registration in background
  serviceRegistry.registerService(serviceName).catch(console.error)
  
  try {
    // Wait for service to be ready
    const result = await waitFor({
      predicate: async () => {
        const health = await serviceRegistry.checkServiceHealth(serviceName)
        return health.status === 'UP'
      },
      delay: 1000,
      retryOnError: true,
      onHeartbeat: (config) => {
        console.log(`Checking service health... Attempt ${config.attempt}`)
      },
      onError: (error) => {
        console.log('Service check failed, retrying...', error.message)
      },
      onSuccess: () => {
        console.log('Service is ready!')
      },
      onFailure: (error) => {
        console.error('Service health check failed:', error.message)
      }
    })
    
    console.log('Service coordination result:', result)
    return result
  } catch (error) {
    console.error('Microservices coordination failed:', error)
    return false
  }
}
```

### Queue Processing

This example demonstrates how to use wait-for to wait for
a queue to be empty before proceeding.

```javascript
const { waitFor } = require('@davidwells/wait-for')

// Mock queue service for example
class MockQueueService {
  constructor() {
    this.queue = []
    this.processing = false
  }

  async addToQueue(item) {
    this.queue.push(item)
    return item
  }

  async processQueue() {
    this.processing = true
    while (this.queue.length > 0) {
      const item = this.queue.shift()
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1000))
      console.log(`Processed item: ${item}`)
    }
    this.processing = false
  }

  async getStats() {
    return {
      pending: this.queue.length,
      processing: this.processing
    }
  }
}

async function run() {
  console.log('Starting queue processing example...')
  
  const queueService = new MockQueueService()
  
  // Add some items to the queue
  await queueService.addToQueue('item-1')
  await queueService.addToQueue('item-2')
  await queueService.addToQueue('item-3')
  
  // Start queue processing in background
  queueService.processQueue().catch(console.error)
  
  try {
    // Wait for queue to be empty
    const result = await waitFor({
      predicate: async () => {
        const stats = await queueService.getStats()
        return stats.pending === 0 && !stats.processing
      },
      delay: 1000,
      maxRetries: 20,
      onHeartbeat: (config) => {
        console.log(`Queue still processing... Attempt ${config.attempt}`)
      },
      onSuccess: () => {
        console.log('Queue processing completed!')
      },
      onFailure: (error) => {
        console.error('Queue processing failed:', error.message)
      }
    })
    
    console.log('Queue processing result:', result)
    return result
  } catch (error) {
    console.error('Queue processing check failed:', error)
  }
}
```

### Resource Cleanup

This example demonstrates how to use wait-for with AbortController
to wait for resources to be released and handle cleanup timeouts.

```javascript
const { waitFor } = require('@davidwells/wait-for')

// Mock resource manager for example
class MockResourceManager {
  constructor() {
    this.resources = new Set()
    this.usage = 0
  }

  allocateResource(key) {
    const id = `resource-${Date.now()}-${key}`
    this.resources.add(id)
    this.usage += 10
    console.log(`Allocated resource ${id}, usage: ${this.usage}%`)
    return id
  }

  releaseResource(id) {
    if (this.resources.has(id)) {
      this.resources.delete(id)
      this.usage -= 10
      console.log(`Released resource ${id}, usage: ${this.usage}%`)
    } else {
      console.log(`Resource ${id} not found to release`)
    }
  }

  getResourceUsage() {
    console.log(`Current resources: ${Array.from(this.resources).join(', ')}`)
    return this.usage
  }
}

async function run() {
  console.log('Starting resource cleanup example...')
  
  const resourceManager = new MockResourceManager()
  const controller = new AbortController()
  
  // Allocate some resources
  const resource1 = resourceManager.allocateResource(1)
  const resource2 = resourceManager.allocateResource(2)
  
  // Start cleanup in background
  setTimeout(() => {
    console.log('Starting cleanup...')
    resourceManager.releaseResource(resource1)
    resourceManager.releaseResource(resource2)
  }, 1000)
  
  try {
    // Wait for resources to be released
    const result = await waitFor({
      predicate: () => {
        const usage = resourceManager.getResourceUsage()
        console.log(`Checking predicate, usage: ${usage}%`)
        return usage === 0
      },
      abortController: controller,
      delay: 1000,
      timeout: 10000, // Reduced timeout for example
      onHeartbeat: (config) => {
        console.log(`Heartbeat - Resource usage: ${resourceManager.getResourceUsage()}%`)
      }
    })
    
    console.log('Resources cleaned up successfully:', result)
    return result
  } catch (error) {
    console.error('Resource cleanup failed:', error)
  }
}
```

### Test Automation

This example demonstrates how to use wait-for in test automation
to wait for UI elements or conditions to be met.

```javascript
const { waitFor } = require('@davidwells/wait-for')

// Mock DOM environment for example
class MockDOM {
  constructor() {
    this.elements = {}
    this.loaded = false
  }

  addElement(id, content) {
    this.elements[id] = content
  }

  removeElement(id) {
    delete this.elements[id]
  }

  querySelector(selector) {
    return this.elements[selector] || null
  }

  async loadPage() {
    // Simulate page load
    await new Promise(resolve => setTimeout(resolve, 1000))
    this.loaded = true
    return this
  }
}

async function run() {
  console.log('Starting test automation example...')
  
  const dom = new MockDOM()
  
  // Simulate page load
  dom.loadPage().catch(console.error)
  
  try {
    // Wait for loading spinner to disappear
    const result = await waitFor({
      predicate: () => dom.querySelector('#loading-spinner') === null,
      delay: 1000,
      timeout: 5000,
      onHeartbeat: (config) => {
        console.log(`Checking for loading spinner... Attempt ${config.attempt}`)
      },
      onSuccess: () => {
        console.log('Page loaded successfully!')
      },
      onFailure: (error) => {
        console.error('Page load failed:', error.message)
      }
    })
    
    console.log('Test automation result:', result)
    return result
  } catch (error) {
    console.error('Test automation failed:', error)
  }
}
```
<!-- end-doc-gen -->

## License

MIT

## Alternatives approaches

Below is a list of alternative packages that might work for you

- https://github.com/jeffbski/wait-on
- https://github.com/vishnubob/wait-for-it
- https://github.com/devlato/async-wait-until
- https://github.com/Raynos/sync-wait-group