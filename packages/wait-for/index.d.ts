export type WaitForOptions = {
    /**
     * - Function that returns a truthy value when condition is met
     */
    predicate?: Function | undefined;
    /**
     * - Arguments to pass to the predicate function
     */
    args?: any[] | undefined;
    /**
     * - Retry predicate function on non-native errors. Default false.
     */
    retryOnError?: boolean | undefined;
    /**
     * - Maximum time to wait in milliseconds
     */
    timeout?: number | undefined;
    /**
     * - Delay between retries in milliseconds
     */
    delay?: number | undefined;
    /**
     * - Minimum delay between retries
     */
    minDelay?: number | undefined;
    /**
     * - Maximum delay between retries
     */
    maxDelay?: number | undefined;
    /**
     * - Factor to increase delay by on each retry
     */
    exponentialBackoff?: number | undefined;
    /**
     * - Maximum number of retries
     */
    maxRetries?: number | undefined;
    /**
     * - Function called on each iteration with current options
     */
    onHeartbeat?: ((arg0: WaitForApi) => void) | undefined;
    /**
     * - Function called on error with error result
     */
    onError?: ((arg0: WaitForApi) => void) | undefined;
    /**
     * - Function called on successful completion with result
     */
    onSuccess?: ((arg0: WaitForResult) => void) | undefined;
    /**
     * - Function called on failure with error result
     */
    onFailure?: ((arg0: WaitForResult) => void) | undefined;
    /**
     * - Function called with (error, result) on completion
     */
    callback?: ((arg0: Error | null, arg1: WaitForResult | null) => void) | undefined;
    /**
     * - Random jitter range for delay (0-1)
     */
    jitterRange?: number | undefined;
    /**
     * - AbortController to control operation
     */
    abortController?: AbortController | undefined;
    /**
     * - Whether to append config to predicate arguments
     */
    enhanceArgs?: boolean | undefined;
};
export type WaitForApi = WaitForOptions & {
    attempt: number;
    retries: number;
    elapsed: number;
    message: string;
    settle: Function;
    abort: Function;
    isAborted: boolean;
    isSettled: boolean;
    nextDelay?: number;
    promise?: {
        resolve: (value: WaitForResult | PromiseLike<WaitForResult>) => void;
        reject: (reason?: any) => void;
    };
};
export type _WFInternalState = WaitForApi & {
    _init: boolean;
    id: string;
    timeoutId?: number;
    abortHandlerFn?: (this: AbortSignal, ev: Event) => any;
    nextDelay?: number;
    promise?: {
        resolve: (value: WaitForResult | PromiseLike<WaitForResult>) => void;
        reject: (reason?: any) => void;
    };
};
export type WaitForResult = {
    /**
     * - Whether the operation was successful
     */
    success: boolean;
    /**
     * - The value returned by the predicate when successful
     */
    value?: any;
    /**
     * - Error message when unsuccessful
     */
    message?: string | undefined;
    /**
     * - Error object when unsuccessful
     */
    error?: Error | undefined;
    /**
     * - The state of the operation
     */
    state: WaitForOptions;
};
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
export function waitFor(fnOrOpts: Function | WaitForOptions, opts?: WaitForOptions, ...args: any[]): Promise<WaitForResult>;
export function noOp(): void;
