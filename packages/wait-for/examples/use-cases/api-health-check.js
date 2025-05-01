/**
 * API Health Check Example
 * 
 * This example demonstrates how to use wait-for to check the health of an external API
 * before proceeding with application startup.
 */
const { waitFor } = require('../../index')
const { TEST_DELAY, WAIT_FOR_DELAY } = require('./_constants')

// Mock API client for example
class MockAPIClient {
  constructor() {
    this.healthy = false
  }

  async start() {
    // Simulate API startup
    await new Promise(resolve => setTimeout(resolve, TEST_DELAY))
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
      delay: WAIT_FOR_DELAY,
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

if (require.main === module) {
  run().catch(console.error)
}

module.exports = {
  run,
  MockAPIClient
} 