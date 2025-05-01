const { test } = require('uvu')
const assert = require('uvu/assert')
const fs = require('fs')
const path = require('path')

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
    await testFn()
    const end = process.hrtime.bigint()
    const duration = Number(end - start) / 1e6 // Convert to milliseconds
    console.log(`Test "${name}" took ${duration.toFixed(2)}ms`)
  }
}

test('API Health Check', measureTest('API Health Check', async () => {
  const api = new apiHealthCheck.MockAPIClient()
  await api.start()
  const result = await api.checkHealth()
  assert.equal(result.status, 'healthy')
}))

test('CI/CD Pipeline', measureTest('CI/CD Pipeline', async () => {
  const deploymentService = new cicdPipeline.MockDeploymentService()
  const deploymentId = 'test-deploy'
  await deploymentService.startDeployment(deploymentId)
  const status = await deploymentService.checkDeploymentStatus(deploymentId)
  assert.equal(status.status, 'COMPLETED')
}))

test('Microservices', measureTest('Microservices', async () => {
  const serviceRegistry = new microservices.MockServiceRegistry()
  const serviceName = 'test-service'
  await serviceRegistry.registerService(serviceName)
  const health = await serviceRegistry.checkServiceHealth(serviceName)
  assert.equal(health.status, 'UP')
}))

test('Test Automation', measureTest('Test Automation', async () => {
  const dom = new testAutomation.MockDOM()
  await dom.loadPage()
  assert.is(dom.loaded, true)
  assert.is(dom.querySelector('#loading-spinner'), null)
}))

test('File System', measureTest('File System', async () => {
  const tempDir = path.join(__dirname, 'temp')
  const filePath = path.join(tempDir, 'test.txt')
  
  // Create temp directory if it doesn't exist
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir)
  }
  
  const creator = new fileSystem.FileCreator(filePath)
  await creator.createFile()
  assert.is(creator.created, true)
  assert.is(fs.existsSync(filePath), true)
  
  // Clean up
  fs.unlinkSync(filePath)
  fs.rmdirSync(tempDir)
}))

test('Resource Cleanup', measureTest('Resource Cleanup', async () => {
  const resourceManager = new resourceCleanup.MockResourceManager()
  const resourceId = resourceManager.allocateResource()
  assert.is(resourceManager.resources.has(resourceId), true)
  assert.equal(resourceManager.getResourceUsage(), 10)
  
  resourceManager.releaseResource(resourceId)
  assert.is(resourceManager.resources.has(resourceId), false)
  assert.equal(resourceManager.getResourceUsage(), 0)
}))

test('Database Connection', measureTest('Database Connection', async () => {
  const db = new databaseConnection.MockDatabase()
  await db.connect()
  assert.is(db.connected, true)
  const result = await db.ping()
  assert.equal(result.status, 'ok')
}))

test('Queue Processing', measureTest('Queue Processing', async () => {
  const queueService = new queueProcessing.MockQueueService()
  const item = 'test-item'
  await queueService.addToQueue(item)
  
  const stats = await queueService.getStats()
  assert.equal(stats.pending, 1)
  assert.equal(stats.processing, false)
  
  await queueService.processQueue()
  const finalStats = await queueService.getStats()
  assert.equal(finalStats.pending, 0)
  assert.equal(finalStats.processing, false)
}))

test('Configuration', measureTest('Configuration', async () => {
  const configService = new configuration.MockConfigService()
  await configService.loadConfig()
  assert.is(configService.isReady(), true)
  const config = configService.getConfig()
  assert.equal(config.environment, 'development')
  assert.equal(config.timeout, 5000)
  assert.equal(config.apiKey, 'test-key')
}))

test('Event Driven', measureTest('Event Driven', async () => {
  const eventProcessor = new eventDriven.MockEventProcessor()
  const eventId = 'event-123'
  
  // Initial status should be PENDING
  const initialStatus = await eventProcessor.checkEventStatus(eventId)
  assert.equal(initialStatus.status, 'PENDING')
  
  // Process event
  await eventProcessor.processEvent(eventId)
  
  // Final status should be PROCESSED
  const finalStatus = await eventProcessor.checkEventStatus(eventId)
  assert.equal(finalStatus.status, 'PROCESSED')
}))

test.run() 