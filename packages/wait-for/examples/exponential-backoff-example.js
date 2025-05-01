/**
 * Exponential Backoff Example of wait-for
 * 
 * This example demonstrates how to use wait-for with exponential backoff:
 * - Increasing delay between retries
 * - Setting min and max delay limits
 * - Adding jitter to prevent thundering herd problems
 */

const { waitFor } = require('../index')

// Example 1: Basic exponential backoff
async function basicExponentialBackoff() {
  console.log('Starting basic exponential backoff example...')
  let startTime = Date.now()
  
  let counter = 0
  
  const predicate = () => {
    counter++
    console.log(`Predicate called ${counter} times. Elapsed: ${Date.now() - startTime}ms`)
    return counter >= 7 // Will return true after 5 calls
  }
  
  try {
    // Wait for the predicate with exponential backoff
    const result = await waitFor(predicate, { 
      delay: 500, // Start with 100ms
      exponentialBackoff: 2, // Double the delay each time
      maxDelay: 3000 // Cap at 1 second
    })
    console.log('Success!', result)
  } catch (error) {
    console.error('Error:', error)
  }
}

// Example 2: Exponential backoff with jitter
async function jitterExample() {
  console.log('\nStarting exponential backoff with jitter example...')
  
  let counter = 0
  
  const predicate = () => {
    counter++
    console.log(`Predicate called ${counter} times`)
    return counter >= 4 // Will return true after 4 calls
  }
  
  try {
    // Wait for the predicate with exponential backoff and jitter
    const result = await waitFor(predicate, { 
      delay: 200, // Start with 200ms
      exponentialBackoff: 1.5, // Increase by 50% each time
      jitterRange: 0.25, // Add up to 25% random jitter
      minDelay: 100, // Never go below 100ms
      maxDelay: 2000 // Cap at 2 seconds
    })
    console.log('Success!', result)
  } catch (error) {
    console.error('Error:', error)
  }
}

// Example 3: Exponential backoff with heartbeat
async function heartbeatExample() {
  console.log('\nStarting exponential backoff with heartbeat example...')
  
  let counter = 0
  
  const predicate = () => {
    counter++
    console.log(`Predicate called ${counter} times`)
    return counter >= 6 // Will return true after 6 calls
  }
  
  try {
    // Wait for the predicate with exponential backoff and heartbeat
    const result = await waitFor(predicate, { 
      delay: 300, // Start with 300ms
      exponentialBackoff: 1.8, // Increase by 80% each time
      maxDelay: 3000, // Cap at 3 seconds
      onHeartbeat: (config) => {
        console.log(`Heartbeat: Attempt ${config.attempt}, Elapsed: ${config.elapsed}ms, Next delay: ${config.nextDelay}ms`)
      }
    })
    console.log('Success!', result)
  } catch (error) {
    console.error('Error:', error)
  }
}

// Run all examples
async function runExamples() {
  /*
  await basicExponentialBackoff()
  /** */
  //*
  await jitterExample()
  /** */
  /*
  await heartbeatExample()
  /** */
}

runExamples().catch(console.error) 