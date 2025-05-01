// @/ts-nocheck
const userLandState = new Map()
const noOp = () => {}

/**
 * @typedef {Object} WaitForOptions
 * @property {Function}   [predicate] - Function that returns a truthy value when condition is met
 * @property {Array<any>} [args] - Arguments to pass to the predicate function
 * @property {boolean}    [retryOnError=false] - Retry predicate function on non-native errors. Default false.
 * @property {number}     [timeout=Infinity] - Maximum time to wait in milliseconds
 * @property {number}     [delay=1000] - Delay between retries in milliseconds
 * @property {number}     [minDelay] - Minimum delay between retries
 * @property {number}     [maxDelay] - Maximum delay between retries
 * @property {number}     [exponentialBackoff] - Factor to increase delay by on each retry
 * @property {number}     [maxRetries=Infinity] - Maximum number of retries
 * @property {function(WaitForApi): void}    [onHeartbeat] - Function called on each iteration with current options
 * @property {function(WaitForApi): void}    [onError] - Function called on error with error result
 * @property {function(WaitForResult): void} [onSuccess] - Function called on successful completion with result
 * @property {function(WaitForResult): void} [onFailure] - Function called on failure with error result
 * @property {function(Error|null, WaitForResult|null): void} [callback] - Function called with (error, result) on completion
 * @property {number} [jitterRange] - Random jitter range for delay (0-1)
 * @property {AbortController} [abortController] - AbortController to control operation
 * @property {boolean} [enhanceArgs] - Whether to append config to predicate arguments
 */

/**
 * @typedef {WaitForOptions & {
 *   attempt: number,
 *   retries: number,
 *   elapsed: number,
 *   message: string,
 *   settle: Function,
 *   abort: Function,
 *   isAborted: boolean,
 *   isSettled: boolean,
 *   nextDelay?: number
 *    promise?: { 
 *     resolve: (value: WaitForResult | PromiseLike<WaitForResult>) => void,
 *     reject: (reason?: any) => void 
 *   },
 * }} WaitForApi
 */

/**
 * @typedef {WaitForApi & {
 *   _init: boolean,
 *   id: string,
 *   timeoutId?: number,
 *   abortHandlerFn?: (this: AbortSignal, ev: Event) => any,
 *   nextDelay?: number
 *    promise?: { 
 *     resolve: (value: WaitForResult | PromiseLike<WaitForResult>) => void,
 *     reject: (reason?: any) => void 
 *   },
 * }} _WFInternalState
 */

/**
 * @typedef {Object} WaitForResult
 * @property {boolean} success - Whether the operation was successful
 * @property {*} [value] - The value returned by the predicate when successful
 * @property {string} [message] - Error message when unsuccessful
 * @property {Error} [error] - Error object when unsuccessful
 * @property {WaitForOptions} state - The state of the operation
 */

/**
 * Waits for a condition to be met by repeatedly calling a predicate function.
 * 
 * @param {Function|WaitForOptions} fnOrOpts - Either a predicate function or options object
 * @param {WaitForOptions} [opts] - Options object if first parameter is a function
 * @returns {Promise<WaitForResult>} A promise that resolves when the condition is met or rejects on failure
 * 
 * @example
 * // Using a function as predicate
 * waitFor(async () => {
 *   const result = await someAsyncOperation();
 *   return result.success;
 * }, { timeout: 5000 });
 * 
 * @example
 * // Using an options object
 * waitFor({
 *   predicate: async () => {
 *     const result = await someAsyncOperation();
 *     return result.success;
 *   },
 *   timeout: 5000,
 *   delay: 1000,
 *   maxRetries: 10
 * });
 */
function waitFor(fnOrOpts, opts = {}) {
  const options = /** @type {_WFInternalState} */ (typeof fnOrOpts === 'object' ? fnOrOpts : opts)
  const lastArg = arguments[arguments.length - 1]

  // Only wrap callbacks in once() on first call, not in recursive calls
  if (!options._init) {
    options.id = uuid()
    // @ts-ignore
    options.callback = once(arguments.length > 1 && isFn(lastArg) ? lastArg : options.callback)
    // @ts-ignore
    options.onFailure = once(options.onFailure || noOp)
    // @ts-ignore
    options.onSuccess = once(options.onSuccess || noOp)
  }

  const onHeartbeat = options.onHeartbeat || noOp
  
  /** @type {number} */
  const retries = options._init ? options.retries + 1 : 0
  const config = {
    id: options.id,
    attempt: options.attempt ?? 0,
    retries,
    maxRetries: options.maxRetries || Infinity,
    elapsed: options.elapsed || 0,
    predicate: (isFn(fnOrOpts) ? fnOrOpts : fnOrOpts.predicate) || noOp,
    args: options.args || [],
    timeout: options.timeout, // 10 seconds
    delay: options.delay || 1e3, // 1 second
    minDelay: options.minDelay,
    maxDelay: options.maxDelay, // || 10e3, // 10 seconds
    exponentialBackoff: options.exponentialBackoff, // || 1.5
    jitterRange: options.jitterRange || 0, // .25
    abortController: options.abortController,
    message: options.message || '',
    isAborted: options.isAborted,
    isSettled: options.isSettled,
    onHeartbeat,
    onError: options.onError,
    onSuccess: options.onSuccess,
    onFailure: options.onFailure,
    exitSuccess,
    exitFailure,
    callback: options.callback,
    nextDelay: options.nextDelay || 0,
    abortHandlerFn: options.abortHandlerFn,
    enhanceArgs: options.enhanceArgs || false,
    retryOnError: options.retryOnError ?? (!options.onError ? false : true),
    promise: undefined,
    settle: (value) => {
      config.isSettled = value
      userLandState.set(config.id, { ...config, isSettled: value })
      return exitSuccess({ success: true, value, caller: '.settle()', state: config }, config, true)
    },
    abort: (reason) => {
      config.isAborted = true
      config.message = reason || '.abort() called'
      userLandState.set(config.id, { ...config, isAborted: true, message: reason })
      return exitFailure({ success: false, message: reason, caller: '.abort()', state: config }, config, true)
    },
    _init: true,
  }

  const predicate = (options.enhanceArgs) ? appendArguments(config.predicate, config) : config.predicate

  let { id, timeout, delay, minDelay, maxDelay, elapsed, maxRetries, exponentialBackoff, jitterRange, abortController } = config

  /* Don't continue if already settled */
  if (config.isSettled) {
    return exitSuccess({ success: true, value: config.isSettled, caller: 'preCallIsSettled', state: config }, config)
  }

  /* Don't continue if aborted */
  if (config.isAborted || abortController?.signal?.aborted) {
    return exitFailure({ message: config.message, caller: 'abortCalled', state: config }, config)
  }

  /* Check if timeout already exceeded - add this near the top */
  if (timeout && elapsed > timeout) {
    const message = `Operation timed out. Max timeout ${timeout}ms already exceeded at ${elapsed}ms.`
    return exitFailure({ success: false, message, caller: 'timeoutNow', state: config }, config)
  }
  
  /* Listener for external abort call */
  if (abortController && abortController.signal && !config.abortHandlerFn) {
    const handler = () => {
      config.message = 'Operation aborted' + (abortController?.signal?.reason ? `: ${abortController.signal.reason}` : '')
      return exitFailure({ success: false, message: config.message, caller: 'abortController', state: config }, config)
    }
    abortController.signal.addEventListener('abort', handler, { once: true })
    config.abortHandlerFn = handler // Store reference to handler
  }

  // Calculate next delay with exponentialBackoff if enabled
  if (exponentialBackoff) {
    if (typeof exponentialBackoff !== 'number') {
      throw new Error(`exponentialBackoff ${exponentialBackoff} must be a number. E.g. 1.5`)
    }
    delay = delay * Math.pow(exponentialBackoff, retries)  
  }

  // Apply max delay if provided
  if (maxDelay) {
    delay = Math.min(maxDelay, delay)
  }

  /* Jitter interval */
  if (typeof jitterRange === 'number') {
    if (jitterRange < 0 || jitterRange >= 1) {
      throw new Error(`jitterRange ${jitterRange} must be a decimal number between 1 and 0`)
    }
    if (jitterRange > 0 && jitterRange < 1) {
      // console.log('delay', delay)
      const jitterMinDelay = delay * (1 - jitterRange)
      delay = Math.floor(jitterMinDelay + Math.random() * (delay - jitterMinDelay))
    }
  }

  /* Ensure min delay is respected if set */
  if (minDelay) {
    delay = Math.max(delay, minDelay)
  }
  
  // Calculate the next elapsed time
  const nextElapsed = elapsed + delay
  /* Check if we'll exceed timeout with this next delay with slight buffer of 10ms */
  if (timeout && !isWithinTimeout(nextElapsed, timeout, 10)) {
    const message = `Operation timed out. Max timeout ${timeout}ms next execution would be at ${nextElapsed}ms.`
    return exitFailure({ success: false, message, caller: 'timeoutNext', state: config }, config)
  }

  // Check max retries before continuing
  if (retries >= maxRetries) {
    const message = `Operation retry limit ${maxRetries} reached. Elapsed time ${elapsed}ms`
    return exitFailure({ success: false, message, caller: 'maxRetries', state: config }, config)
  }

  if (onHeartbeat) {
    try {
      onHeartbeat(config)
    } catch (err) {
      // console.log('onHeartbeat error', err)
      const error = err instanceof Error ? err : new Error(String(err))
      return exitFailure({ success: false, message: error.message, caller: 'onHeartbeatError', error, state: config }, config)
    }
  }

  return new Promise((resolve, reject) => {
    // @ts-ignore
    config.promise = { resolve, reject }
    // Handle abort signal if provided
    if (abortController && abortController.signal && abortController.signal.aborted) {
      const message = config.message || `Operation aborted after ${elapsed}ms`
      return exitFailure({ success: false, message, caller: 'prePredicateAborted', state: config }, config)
    }

    // Function to execute the predicate and handle the result
    const executeRecursivePredicate = async () => {
      /* Abort previously resolved or aborted promises from userland actions */
      if (id && userLandState.has(id)) {
        const details = userLandState.get(id)
        // Pass down the resolve and reject functions exit call so promises can be resolved or rejected
        details.promise = { resolve, reject }
        if (details.isSettled) {
          userLandState.delete(id)
          return exitSuccess({ success: true, value: details.isSettled, caller: 'predicate .settle()', state: details }, details)
        }
        if (details.isAborted) {
          userLandState.delete(id)
          return exitFailure({ success: false, message: details.message, caller: 'predicate .abort()', state: details }, details)
        }
      }

      /* Don't continue if aborted */
      if (config.isAborted || abortController?.signal?.aborted) {
        return exitFailure({ 
          success: false, 
          message: config.message || abortController?.signal?.reason || 'NA', 
          caller: 'predicateAborted', 
          state: config 
        }, config)
      }

      /* Don't continue if settled */
      if (config.isSettled) {
        return exitSuccess({ success: true, value: config.isSettled, caller: 'predicateIsSettled', state: config }, config)
      }

      config.attempt = config.attempt + 1

      const predicateStartTime = Date.now()
      try {
        config.nextDelay = delay
        const ensureArgsIsArray = Array.isArray(config.args) ? config.args : [config.args]
        const done = await predicate(...ensureArgsIsArray, config)
        const predicateRunTime = Date.now() - predicateStartTime
        /* if value truthy, settle */
        if (done) {
          return exitSuccess({ success: true, value: done, caller: 'predicateDone', state: config }, config)
        }
        /* Update state for next iteration */
        // config.retries = config.retries + 1
        config.elapsed = nextElapsed + predicateRunTime
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        /* If error is native, throw it */
        throwNativeErrors(error)


        /* If onError is provided, call it */
        if (config.onError) {
          config.message = error.message
          config.error = error
          config.onError(config)
        }

        /* If failOnError is true, reject the promise */
        if (config.retryOnError === false) {
          return exitFailure({ 
            success: false, 
            message: error.message,
            caller: 'predicateError',
            error, 
            state: config
          }, config)
        }
        /* Update state for next iteration */
        //config.retries = config.retries + 1
        config.elapsed = nextElapsed + (Date.now() - predicateStartTime)
      }
      // Connect recursive call to promise chain
      waitFor(config.predicate, config).then(resolve).catch(reject)
    }

    // For first attempt (config.attempt === 0), execute immediately
    if (config.attempt === 0) {
      return executeRecursivePredicate()
    }
    /* For subsequent retries, use setTimeout */
    config.timeoutId = setTimeout(executeRecursivePredicate, delay)
  })
}

function isWithinTimeout(elapsed, timeout, buffer = 10) {
  return elapsed <= (timeout + buffer)
}

/**
 * Type guard to check if a value is a function
 * 
 * @param {*} fn - The value to check
 * @returns {fn is Function} True if the value is a function
 */
function isFn(fn) {
  return typeof fn === 'function'
}

/* Native Error types https://mzl.la/2Veh3TR */
const nativeExceptions = [
  EvalError, RangeError, ReferenceError, SyntaxError, TypeError, URIError
].filter(isFn)

/* Throw native errors. ref: https://bit.ly/2VsoCGE */
function throwNativeErrors(error) {
  if (nativeExceptions.some(Exception => error instanceof Exception)) throw error
}

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8)
    return v.toString(16)
  })
}

/**
 * Creates a function that can only be called once. Subsequent calls return the result of the first call.
 * 
 * @param {Function} fn - The function to wrap
 * @returns {Function} A function that can only be called once
 */
function once(fn) {
  if (!isFn(fn)) return fn
  let called = false
  let result
  return function(...args) {
    if (called) return result
    called = true
    result = fn.apply(this, args)
    return result
  }
}

/**
 * Helper functions for resolving or rejecting the waitFor promise
 */
async function exitSuccess(result, options, noReject) {
  return exit('resolve', result, options, noReject)
}
async function exitFailure(result, options, noReject) {
  return exit('reject', result, options, noReject)
}

/**
 * Handles the final resolution or rejection of the waitFor promise
 * 
 * @param {'resolve'|'reject'} type - The type of resolution
 * @param {WaitForResult} result - The result object
 * @param {_WFInternalState} options - The options object
 * @param {boolean} [noReject] - Whether to skip rejection
 * @returns {Promise<WaitForResult>|WaitForResult} The resolved or rejected promise
 */
function exit(type, result, options, noReject) {
  /* Clean up resources */
  if (options.timeoutId) {
    clearTimeout(options.timeoutId)
    options.timeoutId = undefined
  }
  
  if (options.abortHandlerFn && options.abortController && options.abortController.signal) {
    options.abortController.signal.removeEventListener('abort', /** @type {(this: AbortSignal, ev: Event) => any} */ (options.abortHandlerFn))
    options.abortHandlerFn = undefined
  }

  const isSuccess = type === 'resolve'
  result.state = options
  // Call appropriate callbacks
  if (isSuccess) {
    options.onSuccess?.(result)
  } else {
    options.onFailure?.(result)
  }
  // Fire callback if provided
  if (options.callback) {
    // @ts-ignore
    options.callback(isSuccess ? null : result, isSuccess ? result : null)
  }
  if (noReject) {
    // console.log('exit Promise.resolve result')
    return Promise.resolve(result)
  }
  // Ensure rejection always uses an Error object
  if (type === 'reject' && !(result.error instanceof Error)) {
    result.error = new Error(String(result.message))
  }
  // Handle promise resolution/rejection
  if (options.promise && typeof options.promise[type] === 'function') {
    // @ts-ignore
    return options.promise[type](result)
  }
  // Return appropriate promise
  // console.log('exit', isSuccess ? 'resolve' : 'reject', result)
  return isSuccess ? Promise.resolve(result) : Promise.reject(result)
}

/**
 * Appends additional arguments to a function call
 * 
 * @param {Function} fn - The function to wrap
 * @param {*} lastArg - The argument to append
 * @returns {Function} A function that appends the lastArg to the original function's arguments
 */
function appendArguments(fn, lastArg) {
  return function () {
    /* Get original args */
    const args = Array.prototype.slice.call(arguments)
    /* Create clone of args */
    let newArgs = new Array(fn.length)
    for (let i = 0; i < args.length; i++) {
      newArgs[i] = args[i]
    }
    /* Append new arg to end */
    newArgs[newArgs.length] = lastArg
    // Set instance on extended methods
    return fn.apply({ instance: lastArg }, newArgs)
  }
}

module.exports = {
  waitFor,
  noOp
}