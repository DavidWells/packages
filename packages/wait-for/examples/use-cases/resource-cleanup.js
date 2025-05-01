/**
 * Resource Cleanup Example
 * 
 * This example demonstrates how to use wait-for with AbortController
 * to wait for resources to be released and handle cleanup timeouts.
 */
const { waitFor } = require('../../index')
const { TEST_DELAY, WAIT_FOR_DELAY } = require('./_constants')

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
  }, TEST_DELAY)
  
  try {
    // Wait for resources to be released
    const result = await waitFor({
      predicate: () => {
        const usage = resourceManager.getResourceUsage()
        console.log(`Checking predicate, usage: ${usage}%`)
        return usage === 0
      },
      abortController: controller,
      delay: WAIT_FOR_DELAY,
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

if (require.main === module) {
  run().catch(console.error)
}

module.exports = {
  run,
  MockResourceManager
} 