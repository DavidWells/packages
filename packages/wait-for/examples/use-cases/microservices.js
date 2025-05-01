/**
 * Microservices Coordination Example
 * 
 * This example demonstrates how to use wait-for to coordinate
 * between microservices, such as waiting for a dependent service
 * to be ready.
 */
const { waitFor } = require('../../index')
const { TEST_DELAY, WAIT_FOR_DELAY } = require('./_constants')

// Mock service registry for example
class MockServiceRegistry {
  constructor() {
    this.services = new Map()
  }

  async registerService(name) {
    // Simulate service startup
    await new Promise(resolve => setTimeout(resolve, TEST_DELAY))
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
      delay: WAIT_FOR_DELAY,
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

if (require.main === module) {
  run().catch(console.error)
}

module.exports = {
  run,
  MockServiceRegistry
} 