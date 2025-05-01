/**
 * Test Automation Example
 * 
 * This example demonstrates how to use wait-for in test automation
 * to wait for UI elements or conditions to be met.
 */
const { waitFor } = require('../../index')
const { TEST_DELAY, WAIT_FOR_DELAY } = require('./_constants')

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
    await new Promise(resolve => setTimeout(resolve, TEST_DELAY))
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
      delay: WAIT_FOR_DELAY,
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

if (require.main === module) {
  run().catch(console.error)
}

module.exports = {
  run,
  MockDOM
} 