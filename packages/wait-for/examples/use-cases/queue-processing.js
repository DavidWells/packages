/**
 * Queue Processing Example
 * 
 * This example demonstrates how to use wait-for to wait for
 * a queue to be empty before proceeding.
 */
const { waitFor } = require('../../index')
const { TEST_DELAY, WAIT_FOR_DELAY } = require('./_constants')

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
      await new Promise(resolve => setTimeout(resolve, TEST_DELAY))
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
      delay: WAIT_FOR_DELAY,
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

if (require.main === module) {
  run().catch(console.error)
}

module.exports = {
  run,
  MockQueueService
} 