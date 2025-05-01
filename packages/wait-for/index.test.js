const { test } = require('uvu')
const assert = require('uvu/assert')
const { waitFor } = require('./index')

// Helper function to create test-specific error
const createTestError = (testName, originalError) => {
  const error = new Error(`Test "${testName}" failed: ${originalError.message}`)
  console.log(error.details)
  error.originalError = originalError
  error.testName = testName
  return error
}

const LOGS_ON = false
const testLogger = (...args) => {
  if (LOGS_ON) {
    console.log('> ', ...args)
  }
}

test('Call flow', async () => {
  let heartbeatCalled = false
  let onSuccessCalled = false
  let onFailureCalled = false
  let callbackCalled = false
  let callbackResult = null
  let promiseResolved = false
  let promiseRejected = false
  let callOrder = []
  try {
    let count = 0
    function predicateHandler(one, two, three, four) {
      const settings = arguments[arguments.length - 1]
      // console.log('───────────────────────────────settings in pred', settings)
      if (settings.retries < 4) {
        // console.log('settings.retries', settings.retries)
        // console.log('one', one)
        // console.log('two', two)
        // console.log('three', three)
        // console.log(`four ${settings.retries}`, four)
        assert.equal(one, 1, 'one should be 1')
        assert.equal(two, 2, 'two should be 2')
        assert.equal(three, 3, 'three should be 3')
        assert.equal(typeof four, 'object', 'four should be object')
        assert.equal(settings.args[0], 1, 'args[0] should be 1')
        assert.equal(settings.args[1], 2, 'args[1] should be 2')
        assert.equal(settings.args[2], 3, 'args[2] should be 3')
      } else {
        // Verify hot swap of args
        testLogger(`four ${settings.retries}`, four)
        assert.equal(four, 4, 'four should be undefined')
      }

      // return true
      return new Promise((resolve) => {
        count++
        testLogger('predicateFn call count', count)
        if (count >= 10) {
          resolve('hello')
        } else {
          resolve(false)
        }
      })
    }

    await waitFor(predicateHandler, {
      delay: 50,
      args: [1, 2, 3],
      // Heartbeat can tweak in flight settings
      onHeartbeat: (api) => {
        testLogger('api.retries', api.retries)
        heartbeatCalled = true
        if (api.retries === 4) {
          api.args = [1, 2, 3, 4]
        }
        // Abort for additional calls
        if (api.retries >= 8) {
          api.abort('internal reason')
        }
      },
      onSuccess: (done) => {
        console.log('onSuccess Fired', done)
        onSuccessCalled = true
      },
      // Swallow errors
      // onError: (err) => {
      //   testLogger('onError Fired', err.message)
      //   onErrorCalled = true
      //   callOrder.push('onError')
      // },
      onFailure: (err) => {
        testLogger('onFailure Fired', err.message)
        assert.equal(err.message, 'internal reason', 'error message should be internal reason')
        onFailureCalled = true
        callOrder.push('onFailure')
      }
    }, (err, result) => {
      if (err) {
        testLogger('Callback error', err.message)
        callbackCalled = true
        callbackResult = err
        assert.equal(err.message, 'internal reason', 'error message should be internal reason')
        callOrder.push('callback')
        return
      }
      testLogger('Callback result', result)
      callbackCalled = true
      callbackResult = result
    }).then((result) => {
      console.log('Promise then result', result)
      promiseResolved = true
    }).catch((err) => {
      testLogger('Promise catch error', err.message)
      assert.equal(err.message, 'internal reason', 'error message should be internal reason')
      promiseRejected = true
      callOrder.push('catch')
      // if (err.details) {
      //   throw createTestError('Promise catch error', err)
      // }
    }).finally(() => {
      testLogger('Promise finally')
      promiseFinally = true
      callOrder.push('finally')
      assert.equal(heartbeatCalled, true, 'heartbeat should be called')
      assert.equal(onSuccessCalled, false, 'onSuccess should not be called')
      assert.equal(onFailureCalled, true, 'onFailure should be called')
      assert.equal(callbackCalled, true, 'callback should be called')
      assert.equal(callbackResult.message, 'internal reason', 'callback result should be internal reason')
      assert.equal(promiseResolved, false, 'promise should not be resolved')
      assert.equal(promiseRejected, true, 'promise should be rejected')
      assert.equal(promiseFinally, true, 'promise should be finally')
      assert.equal(callOrder, ['onFailure', 'callback', 'catch', 'finally'], 'Call order')
    })
  } catch (err) {
    testLogger('Test error:', err)
    throw createTestError('API', err)
  }
})

// Test basic functionality
test('should resolve immediately when predicate returns true', async () => {
  try {
    const result = await waitFor(() => true)
    assert.equal(result.success, true)
    assert.equal(result.value, true)
  } catch (err) {
    console.log('Test error:', err)
    throw createTestError('should resolve immediately when predicate returns true', err)
  }
})

test('should resolve with custom value when predicate returns non-boolean truthy value', async () => {
  try {
    const result = await waitFor(() => 'success')
    assert.equal(result.success, true)
    assert.equal(result.value, 'success')
  } catch (err) {
    console.log('Test error:', err)
    throw createTestError('should resolve with custom value when predicate returns non-boolean truthy value', err)
  }
})

// Test timeout functionality
const timeoutLabel = 'should timeout after specified duration'
test(timeoutLabel, async () => {
  try {
    const result = await waitFor(() => false, { timeout: 100 })
  } catch (err) {
    console.log(`Test ${timeoutLabel} error:`, err.message)
    assert.match(err.message, /Operation timed out/)
    if (!err.message.includes('Operation timed out')) {
      throw createTestError(timeoutLabel, err)
    }
  }
})

// Test retry functionality
const retryLabel = 'should retry specified number of times'
test(retryLabel, async () => {
  try {
    let attempts = 0
    const result = await waitFor(() => {
      attempts++
      return attempts === 3
    }, { maxRetries: 3, delay: 10 })
    
    assert.equal(result.success, true)
    assert.equal(attempts, 3)
  } catch (err) {
    console.log(`Test ${retryLabel} error:`, err.message)
    throw createTestError(retryLabel, err)
  }
})

// Test exponential backoff
const exponentialBackoffLabel = 'should apply exponential backoff'
test(exponentialBackoffLabel, async () => {
  try {
    const delays = []
    let lastTime = Date.now()
    
    await waitFor(() => {
      const now = Date.now()
      delays.push(now - lastTime)
      lastTime = now
      return delays.length === 3
    }, { 
      delay: 100,
      exponentialBackoff: 2,
      maxRetries: 3
    })
    
    // Check if delays are increasing exponentially
    assert.ok(delays[1] > delays[0])
    assert.ok(delays[2] > delays[1])
  } catch (err) {
    console.log(`Test ${exponentialBackoffLabel} error:`, err)
    throw createTestError(exponentialBackoffLabel, err)
  }
})

function delay(ms) {
  console.log('delay', ms)
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Test exponential backoff with maxDelay
const exponentialBackoffWithMaxDelayLabel = 'should apply exponential backoff with maxDelay limit'
test.skip(exponentialBackoffWithMaxDelayLabel, async () => {
  const delays = [0]
  try {

    let lastTime = Date.now()
    
    await waitFor(async (api) => {
      console.log('api', api)
      const now = Date.now()  
      delays.push(api.nextDelay)
      lastTime = now
      await delay(1000)
      return api.retries === 8
    }, { 
      delay: 100,
      exponentialBackoff: 2,
      jitterRange: 0,
      maxDelay: 3000,
      // minDelay: 300,
      maxRetries: 10,
      timeout: 10000
    })
    
    console.log('delays', delays)
    assert.ok(delays[0] === 0, 'Initial call delay should be 0ms')
    // First delay should be ~100ms
    assert.ok(delays[1] >= 90 && delays[1] <= 110, 'First delay should be ~100ms')
    
    // Second delay should be ~200ms (100 * 2)
    assert.ok(delays[2] >= 190 && delays[2] <= 210, 'Second delay should be ~200ms')
    
    // Third delay should be ~300ms (maxDelay)
    assert.ok(delays[3] >= 290 && delays[3] <= 310, 'Third delay should be ~300ms (maxDelay)')
    
    // Fourth delay should still be ~300ms (maxDelay)
    assert.ok(delays[4] >= 290 && delays[4] <= 310, 'Fourth delay should remain at maxDelay')
    
    // Verify delays don't exceed maxDelay
    assert.ok(Math.max(...delays) <= 310, 'No delay should exceed maxDelay')
  } catch (err) {
    console.log(`Test ${exponentialBackoffWithMaxDelayLabel} error:`, err)
    console.log('delays', delays)
    throw createTestError(exponentialBackoffWithMaxDelayLabel, err)
  }
})

// Test abort functionality
const abortLabel = 'should abort when abortController signals abort'
test(abortLabel, async () => {
  try {
    const controller = new AbortController()
    const promise = waitFor(() => false, {
      abortController: controller,
      timeout: 10000
    })
    
    setTimeout(() => {
      controller.abort('test abort')
    }, 50)

    const result = await promise

  } catch (err) {
    console.log(`Test ${abortLabel} error:`, err.message)
    assert.match(err.message, /Operation aborted/)
  }
})

// Test callback functionality
const callbackLabel = 'should call callback with success result'
test(callbackLabel, async () => {
  try {
    let callbackCalled = false
    let callbackResult = null
    
    await waitFor(() => true, {}, (err, result) => {
      callbackCalled = true
      callbackResult = result
    })
    
    assert.ok(callbackCalled)
    assert.equal(callbackResult.success, true)
  } catch (err) {
    console.log(`Test ${callbackLabel} error:`, err)
  }
})


// Test error handling
const errorHandlingLabel = 'should handle predicate errors'
test(errorHandlingLabel, async () => {
  try {
    const result = await waitFor(() => {
      throw new Error('test error')
    })
  
  } catch (err) {
    if (err.message.includes('test error')) {
      assert.match(err.message, /test error/)
    } else {
      console.log(`Test ${errorHandlingLabel} error:`, err)
      throw createTestError(errorHandlingLabel, err)
    }
  }
})

// Test settle functionality
const settleLabel = 'Arrow function should settle with custom value'
test(settleLabel, async () => {
  try {
    const result = await waitFor((...args) => {
      /* Verify api contexts */
      const apiFromArguments = arguments[arguments.length - 1]
      //console.log('apiFromArguments', apiFromArguments)
      assert.equal(typeof apiFromArguments, 'string', 'bound to outer context of test')

      const apiFromThis = this.instance
      // console.log('apiFromThis', apiFromThis)
      assert.equal(typeof apiFromThis, 'undefined', 'this.instance should be undefined')

      const apiFromLastArgs = args[args.length - 1]
      assert.equal(typeof apiFromLastArgs, 'object', 'spread args should exist')
      apiFromLastArgs.settle('custom value')
      /* verify default args */
      assert.equal(args[0], 1, 'one should be 1')
      assert.equal(args[1], 2, 'two should be 2')
      assert.equal(args[2], 3, 'three should be 3')

      return false
    }, {
      args: [1, 2, 3]
    })
    
    assert.equal(result.success, true)
    assert.equal(result.value, 'custom value')
  } catch (err) {
    console.log(`Test ${settleLabel} error:`, err)
    throw createTestError(settleLabel, err)
  }
})

// Test settle functionality
const settleRegularFunctionLabel = 'Regular function should settle with custom value'
test(settleRegularFunctionLabel, async () => {
  try {
    const result = await waitFor(function (one, two, three) {
      const apiFromArguments = arguments[arguments.length - 1]
      assert.equal(typeof apiFromArguments, 'object', 'arguments should exist in function keyword context')

      const apiFromThis = this.instance
      assert.equal(typeof apiFromThis, 'object', 'this.instance should exist in function keyword context')

      assert.equal(apiFromArguments, apiFromThis, 'settings should be the same as this.instance')
      
      apiFromArguments.settle('custom value')

      /* verify default args */
      assert.equal(one, 1, 'one should be 1')
      assert.equal(two, 2, 'two should be 2')
      assert.equal(three, 3, 'three should be 3')

      return false
    }, {
      args: [1, 2, 3],
      enhanceArgs: true
    })
    
    assert.equal(result.success, true)
    assert.equal(result.value, 'custom value')
  } catch (err) {
    console.log(`Test ${settleRegularFunctionLabel} error:`, err)
    throw createTestError(settleRegularFunctionLabel, err)
  }
})

// Test jitter functionality
const jitterLabel = 'should apply jitter to delays'
test(jitterLabel, async () => {
  try {
    const delays = []
    let lastTime = Date.now()
    
    const result = await waitFor(() => {
      const now = Date.now()
      delays.push(now - lastTime)
      lastTime = now
      if (delays.length === 3) {
        return { yay: true }
      }
    }, { 
      delay: 100,
      jitterRange: 0.5,
      maxRetries: 3
    })
    
    // Check if delays are within expected jitter range
    // With jitterRange of 0.5, delays should be between 50ms and 100ms
    const minExpectedDelay = 50
    const maxExpectedDelay = 100
    
    // Check that all delays are within the expected range
    for (let i = 1; i < delays.length; i++) {
      assert.ok(delays[i] >= minExpectedDelay, `Delay ${i} should be at least ${minExpectedDelay}ms. Actual: ${delays[i]}`)
      assert.ok(delays[i] <= maxExpectedDelay, `Delay ${i} should be at most ${maxExpectedDelay}ms. Actual: ${delays[i]}`)
    }
    
    assert.equal(result.value, { yay: true })
  } catch (err) {
    console.log(`Test ${jitterLabel} error:`, err)
    throw createTestError(jitterLabel, err)
  }
})

// Test heartbeat functionality
const heartbeatLabel = 'should call onHeartbeat callback'
test(heartbeatLabel, async () => {
  try {
    let heartbeatCalled = false
    
    await waitFor(() => true, {
      onHeartbeat: () => {
        heartbeatCalled = true
      }
    })
    
    assert.ok(heartbeatCalled)
  } catch (err) {
    console.log(`Test ${heartbeatLabel} error:`, err)
    throw createTestError(heartbeatLabel, err)
  }
})

// Test max retries limit
const maxRetriesLabel = 'should stop after max retries'
test(maxRetriesLabel, async () => {
  try {
    let attempts = 0
    const result = await waitFor(() => {
      attempts++
      return false
    }, { maxRetries: 2, delay: 10 })
    
  
  } catch (err) {
    // console.log('Test error:', err)

    assert.match(err.message, /Operation retry limit/)
    assert.equal(err.state.retries, 2)

    if (!err.message.includes('Operation retry limit')) {
      throw createTestError(maxRetriesLabel, err)
    }
  }
})

// Test basic abort controller functionality
test('should handle basic abort controller', async () => {
  try {
    const controller = new AbortController()
    let counter = 0
    
    const predicate = () => {
      counter++
      return counter >= 10
    }
    
    // Set a timeout to abort after 100ms
    setTimeout(() => {
      controller.abort('Operation timed out by external code')
    }, 100)
    
    const result = await waitFor(predicate, { 
      delay: 20,
      abortController: controller
    })
    
    // Should not reach here as operation should be aborted
    assert.unreachable('Operation should have been aborted')
  } catch (error) {
    assert.match(error.message, /Operation timed out by external code/)
  }
})

// Test aborting from within a callback
test('should handle abort from callback', async () => {
  try {
    let counter = 0
    
    const predicate = () => {
      counter++
      return counter >= 8
    }
    
    const result = await waitFor(predicate, { 
      delay: 20,
      onHeartbeat: (config) => {
        if (config.attempt >= 3) {
          config.abort('Aborted from heartbeat callback')
        }
      }
    })
    
    // Should not reach here as operation should be aborted
    assert.unreachable('Operation should have been aborted')
  } catch (error) {
    assert.match(error.message, /Aborted from heartbeat callback/)
  }
})

// Test settling from within a callback
test('should handle settle from callback', async () => {
  try {
    let counter = 0
    
    const predicate = () => {
      counter++
      return counter >= 5
    }
    
    const result = await waitFor(predicate, { 
      delay: 20,
      onHeartbeat: (config) => {
        if (config.attempt >= 2) {
          config.settle({ message: 'Settled early from callback', attempts: config.attempt })
        }
      }
    })
    
    assert.equal(result.success, true)
    assert.equal(result.value.message, 'Settled early from callback')
    assert.equal(result.value.attempts, 2)
  } catch (error) {
    throw createTestError('should handle settle from callback', error)
  }
})

// Run all tests
test.run() 