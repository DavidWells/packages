const { test } = require('uvu')
const assert = require('uvu/assert')

// Import all example use cases
const apiHealthCheck = require('./api-health-check')
const cicdPipeline = require('./cicd-pipeline')
const microservices = require('./microservices')
const testAutomation = require('./test-automation')
const fileSystem = require('./file-system')
const resourceCleanup = require('./resource-cleanup')
const databaseConnection = require('./database-connection')
const queueProcessing = require('./queue-processing')
const configuration = require('./configuration')
const eventDriven = require('./event-driven')

// Helper function to measure test duration
const measureTest = (name, testFn) => {
  return async () => {
    const start = process.hrtime.bigint()
    const result = await testFn()
    const end = process.hrtime.bigint()
    const duration = Number(end - start) / 1e6 // Convert to milliseconds
    console.log(`Test "${name}" took ${duration.toFixed(2)}ms`)
    return result
  }
}

test('API Health Check Main', measureTest('API Health Check Main', async () => {
  const result = await apiHealthCheck.run()
  assert.equal(result.success, true)
}))

test('CI/CD Pipeline Main', measureTest('CI/CD Pipeline Main', async () => {
  const result = await cicdPipeline.run()
  assert.equal(result.success, true)
}))

test('Microservices Main', measureTest('Microservices Main', async () => {
  const result = await microservices.run()
  assert.equal(result.success, true)
}))

test('Test Automation Main', measureTest('Test Automation Main', async () => {
  const result = await testAutomation.run()
  assert.equal(result.success, true)
}))

test('File System Main', measureTest('File System Main', async () => {
  const result = await fileSystem.run()
  assert.equal(result.success, true)
}))

test('Resource Cleanup Main', measureTest('Resource Cleanup Main', async () => {
  const result = await resourceCleanup.run()
  assert.equal(result.success, true)
}))

test('Database Connection Main', measureTest('Database Connection Main', async () => {
  const result = await databaseConnection.run()
  assert.equal(result.success, true)
}))

test('Queue Processing Main', measureTest('Queue Processing Main', async () => {
  const result = await queueProcessing.run()
  assert.equal(result.success, true)
}))

test('Configuration Main', measureTest('Configuration Main', async () => {
  const result = await configuration.run()
  assert.equal(result.success, true)
}))

test('Event Driven Main', measureTest('Event Driven Main', async () => {
  const result = await eventDriven.run()
  assert.equal(result.success, true)
}))

test.run() 