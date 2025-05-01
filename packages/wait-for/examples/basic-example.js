/**
 * Basic Example of wait-for
 * 
 * This example demonstrates the simplest way to use wait-for:
 * - Waiting for a condition to be true
 * - Using default settings
 */

const { waitFor } = require('../index')

// Example 1: Simple predicate function
async function basicExample() {
  console.log('Starting basic example...')
  
  let counter = 0
  
  // Define a predicate function that will eventually return true
  const predicate = () => {
    counter++
    console.log(`Predicate from basicExample called ${counter} times`)
    return counter >= 5 // Will return true after 5 calls
  }
  
  try {
    // Wait for the predicate to return true
    const result = await waitFor(predicate)
    console.log('Success!', result)
    return result
  } catch (error) {
    console.error('Error:', error)
  }
}

// Example 2: Using with a delay
async function delayExample() {
  console.log('\nStarting delay example...')
  
  let counter = 0
  
  const predicate = () => {
    counter++
    console.log(`Predicate from delayExample called ${counter} times`)
    return counter >= 3 // Will return true after 3 calls
  }
  
  try {
    // Wait for the predicate with a 500ms delay between attempts
    const result = await waitFor(predicate, { delay: 500 })
    console.log('Success!', result)
    return result
  } catch (error) {
    console.error('Error:', error)
  }
}

// Example 3: Using with a timeout
async function timeoutExample() {
  console.log('\nStarting timeout example...')
  
  let counter = 0
  
  const predicate = () => {
    counter++
    console.log(`Predicate from timeoutExample called ${counter} times`)
    return counter >= 10 // Will return true after 10 calls
  }
  
  try {
    // Wait for the predicate with a 2 second timeout
    const result = await waitFor(predicate, { 
      delay: 300,
      timeout: 2000 // 2 seconds
    })
    console.log('Success!', result)
    return result
  } catch (error) {
    console.error('Timeout occurred as expected:', error.message)
  }
}

// Run all examples
async function runExamples() {
  const result = await basicExample()
  console.log('basicExample result', result)
  const result2 = await delayExample()
  console.log('delayExample result', result2)
  
  timeoutExample().catch((err) => {
    console.error('timeoutExample Error:', err)
  })
}

if (require.main === module) {
  runExamples().catch(console.error) 
}

module.exports = {
  basicExample,
  delayExample,
  timeoutExample
}
