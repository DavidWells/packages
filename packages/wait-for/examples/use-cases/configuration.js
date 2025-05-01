/**
 * Configuration Loading Example
 * 
 * This example demonstrates how to use wait-for to wait for
 * configuration to be loaded before starting an application.
 */
const { waitFor } = require('../../index')
const { TEST_DELAY, WAIT_FOR_DELAY } = require('./_constants')

// Mock configuration service for example
class MockConfigService {
  constructor() {
    this.config = {}
    this.ready = false
  }

  async loadConfig() {
    // Simulate config loading
    await new Promise(resolve => setTimeout(resolve, TEST_DELAY))
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
      delay: WAIT_FOR_DELAY,
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

if (require.main === module) {
  run().catch(console.error)
}

module.exports = {
  run,
  MockConfigService
} 