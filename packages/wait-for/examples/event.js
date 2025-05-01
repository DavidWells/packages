const { EventEmitter } = require('events')
const { waitFor } = require('../index')

// Create an event emitter
const emitter = new EventEmitter()

// Simulate some async operation that will emit events
function simulateProgressEvents() {
  let progress = 0
  const interval = setInterval(() => {
    progress += 10
    console.log(`-> Emitting "progress" event with ${progress}%`)
    emitter.emit('progress', progress)
    
    if (progress >= 100) {
      clearInterval(interval)
    }
  }, 500)
}

/** Create a predicate that checks if the progress event has reached 100% */
/* Using settle() */
const waitFor100PercentPredicate = ({ attempt, retries, settle }) => {
  console.log(`Attempt ${attempt}`)
  console.log(`Retry count ${retries}`)
  // Listen for the next progress event
  emitter.once('progress', (progress) => {
    console.log(`==> Received progress: ${progress}%`)
    if (progress === 100) {
      settle(progress)
    }
  })
}

/* Using promise.resolve() */
const waitFor100PercentPredicatePromise = ({ attempt, retries }) => {
  return new Promise((resolve) => {
    console.log(`Attempt ${attempt}`)
    console.log(`Settle ${settle}`)
    // Listen for the next progress event
    emitter.once('progress', (progress) => {
      console.log(`==> Received progress: ${progress}%`)
      resolve(progress === 100)
    })
  })
}

const settings = {
  delay: 500,  // Check every 500ms
  timeout: 6000 // Timeout after 5 seconds
}

async function run() {
  const result = await waitFor(waitFor100PercentPredicate, settings, (err, result) => {
    if (err) {
      console.error('Callback error waiting for event:', err)
      return
    }
    console.log('Callback success! Operation completed with 100% progress', result)
  })
  //*
  // Optional promise interface
  .then((result) => {
    console.log('Promise success! Operation completed with 100% progress', result)
    return result
  })
  .catch((err) => {
    console.error('Promise error waiting for event:', err)
  })
  /** */
  console.log('waitFor() result', result)
  
  console.log('do other things')
}

// Start the async operation
simulateProgressEvents()

setTimeout(run, 1000)