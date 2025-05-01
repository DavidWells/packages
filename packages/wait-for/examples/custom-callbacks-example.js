/**
 * Custom Callbacks Example of wait-for
 * 
 * This example demonstrates how to use wait-for with custom callbacks:
 * - Using onSuccess and onFailure callbacks
 * - Using the callback parameter for both success and failure
 * - Enhancing predicate arguments with config
 */

const { waitFor } = require('../index')

// Example 1: Using onSuccess and onFailure callbacks
async function successFailureCallbacks() {
  console.log('Starting success/failure callbacks example...')
  
  let counter = 0
  
  const predicate = (x) => {
    console.log('Predicate called with:', x)
    counter++
    console.log(`Predicate called ${counter} times`, new Date().toISOString())
    return counter >= 4 // Will return true after 4 calls
  }
  
  try {
    // Wait for the predicate with success and failure callbacks
    const result = await waitFor(predicate, { 
      args: ['test-value'],
      delay: 300,
      onSuccess: (result) => {
        console.log('Success callback:', Object.keys(result))
      },
      onFailure: (error) => {
        console.log('Failure callback:', error)
      }
    })
    console.log('Final result:', result)
  } catch (error) {
    console.error('Error:', error)
  }
}

// Example 2: Using the callback parameter
async function callbackParameter() {
  console.log('\nStarting callback parameter example...')
  
  let counter = 0
  
  const predicate = () => {
    counter++
    console.log(`Predicate called ${counter} times`)
    return counter >= 3 // Will return true after 3 calls
  }
  
  // Using the callback parameter for both success and failure
  await waitFor(predicate, { 
    delay: 400,
    timeout: 5000 // 5 seconds
  }, (error, result) => {
    if (error) {
      console.log('Callback error:', error)
    } else {
      console.log('Callback success:', result)
    }
  })
}

// Example 3: Enhancing predicate arguments with config
async function enhanceArgsExample() {
  console.log('\nStarting enhance args example...')
  
  let counter = 0
  
  // Predicate that receives the config as its last argument
  const predicate = (value, config) => {
    counter++
    console.log(`Predicate called ${counter} times with value: ${value}`)
    console.log(`Current attempt: ${config.attempt}, Elapsed time: ${config.elapsed}ms`)
    return counter >= 5 // Will return true after 5 calls
  }
  
  try {
    // Wait for the predicate with enhanced args
    const result = await waitFor(predicate, { 
      delay: 250,
      args: ['test-value'], // Pass initial arguments
      enhanceArgs: true // Enable config as last argument
    })
    console.log('Success!', result)
  } catch (error) {
    console.error('Error:', error)
  }
}

// Example 4: Using callbacks with custom return values
async function customReturnValues() {
  console.log('\nStarting custom return values example...')
  
  let counter = 0
  
  const predicate = () => {
    counter++
    console.log(`Predicate called ${counter} times`)
    if (counter >= 3) {
      return { success: true, data: 'Custom data', attempts: counter }
    }
    return false
  }
  
  try {
    // Wait for the predicate with custom return values
    const result = await waitFor(predicate, { 
      delay: 300,
      onSuccess: (result) => {
        console.log('Success with custom data:', result)
      }
    })
    console.log('Final result with custom data:', result)
    return result.value
  } catch (error) {
    console.error('Error:', error)
  }
}

// Run all examples
async function runExamples() {
  /*
  await successFailureCallbacks()
  /** */
  /*
  await callbackParameter()
  /** */
  /*
  await enhanceArgsExample()
  /** */
  //*
  const result = await customReturnValues()
  console.log('customReturnValues result', result)
  /** */
}

if (require.main === module) {
  runExamples().catch(console.error) 
}

module.exports = {
  successFailureCallbacks,
  callbackParameter,
  enhanceArgsExample,
  customReturnValues
}