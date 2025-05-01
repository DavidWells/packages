const { waitFor } = require('../index')

/** Test code */

let count = 0
// --fail flag set
const FAIL_SET = process.argv.includes('--fail')
const NO_RESOLVE = process.argv.includes('--no-resolve')

function predicateHandler(one, two, three, four) {
  const settings = arguments[arguments.length - 1]
  console.log('predicateHandler Settings', settings)
  // return true
  return new Promise((resolve) => {
    count++
    // settings.abort('Random abort')
    const lastArg = settings.args[settings.args.length - 1]
    console.log('predicateHandler run count', count, lastArg)
    if (count >= 6 && !NO_RESOLVE) {
      resolve(`hello ${lastArg}`)
    } else {
      resolve(false)
    }
  })
}

/* Pass in custom controller to abort */
const controller = new AbortController()
//*
console.time('timeToResolveWaitFor')
waitFor(predicateHandler, {
  delay: 1000,
  args: [1, 2, 3],
  abortController: controller,
  // Heartbeat can tweak in flight settings
  onHeartbeat: (settings) => {
    console.log('tick', settings)
    // HotSwap args to test retry logic
    if (settings.retries >= 1) {
      settings.args = [new Date().toISOString(), settings.retries]
    }
    // if (settings.retries >= 2) {
    //   settings.settle('foo')
    // }
    // // Abort for additional calls
    if (FAIL_SET && settings.retries >= 2) {
      settings.abort('internal reason')
    }
    if (settings.retries >= 50) {
      settings.abort('Over 200 retries. FAIL')
    }
  },
  onSuccess: (done) => {
    console.log('onSuccess Fired', done)
  },
  onFailure: (err) => {
    console.log('onFailure Fired', err)
  }
}, (err, result) => {
  if (err) {
    console.log('Callback error', err)
    return
  }
  console.log('Callback result', result)
}).then((result) => {
  console.log('───────────────────────────────')
  console.log('Promise then result', result)
}).catch((err) => {
  console.log('───────────────────────────────')
  console.log('Promise catch error', err)
}).finally(() => {
  console.log('Promise finally')
  console.timeEnd('timeToResolveWaitFor')
})
/** */

setTimeout(() => {
  console.log('External abort')
  controller.abort('fast exit')
}, 1000)

/*
let runCount = 0
function resolveAfter3() {
  console.log('resolveAfter3', runCount + 1)
  return new Promise((resolve) => {
    runCount++
    if (runCount >= 3) {
      throw new Error('done')
      return resolve('hello')
    } 
    return resolve(false)
  })
}
waitFor({
  predicate: resolveAfter3,
  onSuccess: (done) => console.log('success', done),
  onFailure: (err) => console.log('exitFailure', err),
}).then((done) => {
  console.log('final done', done)
}).catch((err) => {
  console.log('final error', err)
})
/** */