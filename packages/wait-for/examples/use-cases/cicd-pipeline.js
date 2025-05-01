/**
 * CI/CD Pipeline Example
 * 
 * This example demonstrates how to use wait-for to monitor deployment status
 * in a CI/CD pipeline.
 */
const { waitFor } = require('../../index')
const { TEST_DELAY, WAIT_FOR_DELAY } = require('./_constants')

// Mock deployment service for example
class MockDeploymentService {
  constructor() {
    this.deployments = new Map()
  }

  async startDeployment(id) {
    // Simulate deployment process
    await new Promise(resolve => setTimeout(resolve, TEST_DELAY))
    this.deployments.set(id, 'COMPLETED')
    return { id, status: 'COMPLETED' }
  }

  async checkDeploymentStatus(id) {
    const status = this.deployments.get(id) || 'IN_PROGRESS'
    return { id, status }
  }
}

async function run() {
  console.log('Starting CI/CD pipeline example...')
  
  const deploymentService = new MockDeploymentService()
  const deploymentId = 'deploy-123'
  
  // Start deployment in background
  deploymentService.startDeployment(deploymentId).catch(console.error)
  
  try {
    // Wait for deployment to complete
    const result = await waitFor({
      predicate: async () => {
        const status = await deploymentService.checkDeploymentStatus(deploymentId)
        if (status.status === 'COMPLETED') {
          return status
        }
      },
      delay: WAIT_FOR_DELAY,
      exponentialBackoff: 1.5,
      onHeartbeat: (config) => {
        console.log(`Checking deployment status... Attempt ${config.attempt}`)
      },
      onSuccess: () => {
        console.log('Deployment completed successfully!')
      },
      onFailure: (error) => {
        console.error('Deployment failed:', error.message)
      }
    })
    
    console.log('Deployment result:', result.value)
    return result
  } catch (error) {
    console.error('CI/CD pipeline check failed:', error)
    return false
  }
}

if (require.main === module) {
  run().catch(console.error)
}

module.exports = {
  run,
  MockDeploymentService
} 