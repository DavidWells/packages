/**
 * Abort Controller Example of wait-for
 * 
 * This example demonstrates how to use wait-for with AbortController:
 * - Cancelling operations in progress
 * - Handling external abort signals
 * - Using the abort method from within callbacks
 */

const { waitFor } = require('../index')

// Example 1: Basic abort controller
async function basicAbortController() {
  console.log('Starting basic abort controller example...')
  
  // Create an AbortController
  const controller = new AbortController()
  
  let counter = 0
  
  const predicate = () => {
    counter++
    console.log(`Predicate called ${counter} times`)
    return counter >= 10 // Will return true after 10 calls
  }
  
  // Set a timeout to abort after 1 second
  setTimeout(() => {
    console.log('Aborting operation after 1 second')
    controller.abort('Operation timed out by external code')
  }, 1000)
  
  try {
    // Wait for the predicate with abort controller
    const result = await waitFor(predicate, { 
      delay: 200,
      abortController: controller
    })
    console.log('Success!', result)
  } catch (error) {
    console.error('Aborted as expected:', error.message)
  }
}

// Example 2: Aborting from within a callback
async function abortFromCallback() {
  console.log('\nStarting abort from callback example...')
  
  let counter = 0
  
  const predicate = () => {
    counter++
    console.log(`Predicate called ${counter} times`)
    return counter >= 8 // Will return true after 8 calls
  }
  
  try {
    // Wait for the predicate with abort from callback
    const result = await waitFor(predicate, { 
      delay: 300,
      onHeartbeat: (config) => {
        console.log(`Heartbeat: Attempt ${config.attempt}`)
        
        // Abort after 3 attempts
        if (config.attempt >= 3) {
          console.log('Aborting from heartbeat callback')
          config.abort('Aborted from heartbeat callback')
        }
      }
    })
    console.log('Success!', result)
  } catch (error) {
    console.error('Aborted as expected:', error.message)
  }
}

// Example 3: Settling from within a callback
async function settleFromCallback() {
  console.log('\nStarting settle from callback example...')
  
  let counter = 0
  
  const predicate = () => {
    counter++
    console.log(`Predicate called ${counter} times`)
    return counter >= 5 // Will return true after 5 calls
  }
  
  try {
    // Wait for the predicate with settle from callback
    const result = await waitFor(predicate, { 
      delay: 200,
      onHeartbeat: (config) => {
        console.log(`Heartbeat: Attempt ${config.attempt}`)
        
        // Settle after 2 attempts with a custom value
        if (config.attempt >= 2) {
          console.log('Settling from heartbeat callback')
          config.settle({ message: 'Settled early from callback', attempts: config.attempt })
        }
      }
    })
    console.log('Success with custom value:', result)
  } catch (error) {
    console.error('Error:', error)
  }
}

// Run all examples
async function runExamples() {
  //*
  await basicAbortController()
  /** */
  /*
  await abortFromCallback()
  /** */
  /*
  await settleFromCallback()
  /** */
}
if (require.main === module) {
  runExamples().catch(console.error) 
}

module.exports = {
  basicAbortController,
  abortFromCallback,
  settleFromCallback
}