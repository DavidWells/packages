const { waitFor } = require('../index')

async function abort() {
  let counter = 0
  
  const predicate = () => {
    counter++
    return counter >= 8
  }
  
  try {
    const result = await waitFor(predicate, { 
      delay: 20,
      onHeartbeat: (config) => {
        if (config.attempt >= 3) {
          config.abort('Aborted from heartbeat callback on attempt ' + config.attempt)
        }
      }
    })
    
    console.log('result', result)
  } catch (error) {
    console.error('Error caught:', error)
    // Ensure we don't throw unhandled rejections
    return Promise.resolve({ success: false, error })
  }
}

// Handle any unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
})

// Run the abort function and handle any errors
abort().catch(error => {
  console.error('Unhandled error in abort:', error)
})