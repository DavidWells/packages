/**
 * Database Connection Example
 * 
 * This example demonstrates how to use wait-for to wait for a database connection
 * to be ready before starting an application.
 */
const { waitFor } = require('../../index')
const { TEST_DELAY, WAIT_FOR_DELAY } = require('./_constants')

// Mock database client for example
class MockDatabase {
  constructor() {
    this.connected = false
  }

  async connect() {
    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, TEST_DELAY))
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
      delay: WAIT_FOR_DELAY,
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

if (require.main === module) {
  run().catch(console.error)
}

module.exports = {
  run,
  MockDatabase
} 