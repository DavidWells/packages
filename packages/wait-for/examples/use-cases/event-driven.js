/**
 * Event-Driven Systems Example
 * 
 * This example demonstrates how to use wait-for to wait for events
 * to be processed in an event-driven system.
 */
const { waitFor } = require('../../index')
const { TEST_DELAY, WAIT_FOR_DELAY } = require('./_constants')

// Mock event processor for example
class MockEventProcessor {
  constructor() {
    this.events = new Map()
    this.processing = false
  }

  async processEvent(id) {
    // Simulate event processing
    await new Promise(resolve => setTimeout(resolve, TEST_DELAY))
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
      delay: WAIT_FOR_DELAY,
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

if (require.main === module) {
  run().catch(console.error)
}

module.exports = {
  run,
  MockEventProcessor
} 