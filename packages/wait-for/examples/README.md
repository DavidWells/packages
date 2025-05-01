# wait-for Examples

This directory contains examples demonstrating how to use the `wait-for` package in different scenarios.

## Available Examples

1. **Basic Example** (`basic-example.js`)
   - Simple usage of wait-for
   - Using default settings
   - Demonstrating delay and timeout options

2. **Exponential Backoff Example** (`exponential-backoff-example.js`)
   - Using exponential backoff for retries
   - Setting min and max delay limits
   - Adding jitter to prevent thundering herd problems
   - Using heartbeat callbacks

3. **Abort Controller Example** (`abort-controller-example.js`)
   - Cancelling operations in progress
   - Handling external abort signals
   - Using the abort method from within callbacks
   - Settling early from callbacks

4. **Custom Callbacks Example** (`custom-callbacks-example.js`)
   - Using onSuccess and onFailure callbacks
   - Using the callback parameter for both success and failure
   - Enhancing predicate arguments with config
   - Working with custom return values

## How to Run the Examples

Each example can be run directly with Node.js:

```bash
# Run the basic example
node basic-example.js

# Run the exponential backoff example
node exponential-backoff-example.js

# Run the abort controller example
node abort-controller-example.js

# Run the custom callbacks example
node custom-callbacks-example.js
```

## Understanding the Examples

Each example file contains multiple examples demonstrating different aspects of the `wait-for` package. The examples are designed to be self-contained and include detailed comments explaining what each part does.

The examples use a simple counter-based predicate that eventually returns true after a certain number of calls. This allows you to see how the different options affect the behavior of the `wait-for` function.

## Key Concepts Demonstrated

- **Predicate Functions**: Functions that return a truthy value when a condition is met
- **Delay and Timeout**: Controlling how long to wait between attempts and overall
- **Exponential Backoff**: Increasing delay between retries to reduce load
- **Jitter**: Adding randomness to delays to prevent synchronized retries
- **Abort Controller**: Cancelling operations in progress
- **Callbacks**: Handling success and failure cases
- **Enhanced Arguments**: Passing configuration to predicate functions

For more information, refer to the main package documentation. 