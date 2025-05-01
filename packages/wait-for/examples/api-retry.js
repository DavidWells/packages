/**
 * API Retry Example of wait-for
 * 
 * This example demonstrates how to use wait-for to retry API calls:
 * - Simulating API failures for the first two attempts
 * - Using exponential backoff for retries
 * - Handling API responses and errors
 */

const { waitFor } = require('../index')

const startTime = Date.now()

// Simulate an API call that fails for the first two attempts
async function simulateApiCall({ elapsed }) {
  console.log('elapsed', elapsed)
  // Keep track of how many times this function has been called
  simulateApiCall.attempts = (simulateApiCall.attempts || 0) + 1
  
  console.log(`API call attempt #${simulateApiCall.attempts}`)
  
  // Simulate network delay
  console.log('Simulating network delay 1000ms')
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // Fail for the first two attempts, succeed on the third
  if (simulateApiCall.attempts <= 6) {
    console.log('API call failed, elapsed time', Date.now() - startTime)
    throw new Error(`API call failed on attempt ${simulateApiCall.attempts}`)
  }
  
  // Success on third attempt
  console.log('API call succeeded, elapsed time', Date.now() - startTime)
  return {
    status: 'success', 
    data: {
      id: 123,
      name: 'Example Data',
      timestamp: new Date().toISOString()
    }
  }
}

// Reset the counter for testing
simulateApiCall.attempts = 0

// Example 1: Basic API retry with exponential backoff
async function basicApiRetry() {
  console.log('Starting basic API retry example...')
  
  try {
    // Wait for the API call to succeed with exponential backoff
    const result = await waitFor(
      async ({ elapsed }) => {
        try {
          return await simulateApiCall()
        } catch (error) {
          // Log the specific error but don't rethrow
          console.log(`Attempt failed: ${error.message}`)
          // Return false to indicate failure and trigger retry
          return false
        }
      },
      { 
        delay: 1000, // Start with 1 second delay
        exponentialBackoff: 2, // Double the delay each time
        maxDelay: 15000, // Cap at 5 seconds
        maxAttempts: 5 // Limit to 5 attempts
      }
    )
    
    console.log('API call eventually succeeded:', result)
    return result
  } catch (error) {
    console.error('API call failed after all retries:', error)
    throw error
  }
}


// Example 1: Basic API retry with exponential backoff
async function basicApiRetryIgnoreErrors() {
  console.log('Starting basic API retry example...')
  const userLandAbort = false;
  
  try {
    // Wait for the API call to succeed with exponential backoff
    const result = await waitFor(simulateApiCall, {
      delay: 1000, // Start with 1 second delay
      exponentialBackoff: 2, // Double the delay each time
      maxDelay: 5000, // Cap at 5 seconds
      maxRetries: 5, // Limit to 5 attempts
      //retryOnError: true, // Ignore non-native errors and continue retrying
      onError: (waitForApi) => {
        const { error, retries } = waitForApi
        console.log(`predicate error ${retries}:`, error)
        if (userLandAbort && retries >= 2) {
          return waitForApi.abort('Aborted from userland code after 2 retries')
        }
      }
    })
    
    console.log('API call eventually succeeded:', result)
    return result
  } catch (error) {
    console.error('API call failed after all retries:', error)
    // throw error
  }
}

// Example 2: API retry with custom error handling
async function apiRetryWithErrorHandling() {
  console.log('\nStarting API retry with error handling example...')
  
  // Reset the counter for this example
  simulateApiCall.attempts = 0
  
  try {
    // Wait for the API call to succeed with custom error handling
    const result = await waitFor(
      async () => {
        try {
          return await simulateApiCall()
        } catch (error) {
          // Log the specific error but don't rethrow
          console.log(`Attempt failed: ${error.message}`)
          // Return false to indicate failure and trigger retry
          return false
        }
      },
      { 
        delay: 800, // Start with 800ms delay
        exponentialBackoff: 1.5, // Increase by 50% each time
        jitterRange: 0.2, // Add up to 20% random jitter
        minDelay: 500, // Never go below 500ms
        maxDelay: 3000, // Cap at 3 seconds
        onHeartbeat: (config) => {
          console.log(`Retry #${config.attempt}: Next attempt in ${config.nextDelay}ms`)
        }
      }
    )
    
    console.log('API call eventually succeeded:', result)
    return result
  } catch (error) {
    console.error('API call failed after all retries:', error)
    throw error
  }
}

// Run all examples
async function runExamples() {
  //*
  await basicApiRetryIgnoreErrors()
  /** */
  /*
  await basicApiRetry()
  /** */
  /*
  await apiRetryWithErrorHandling()
  /** */
}

if (require.main === module) {
  runExamples().catch(console.error) 
}

module.exports = {
  basicApiRetry,
  basicApiRetryIgnoreErrors,
  apiRetryWithErrorHandling
}