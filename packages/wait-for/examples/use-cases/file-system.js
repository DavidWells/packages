/**
 * File System Operations Example
 * 
 * This example demonstrates how to use wait-for to wait for file system operations
 * to complete, such as waiting for a file to be created or modified.
 */
const fs = require('fs')
const path = require('path')
const { waitFor } = require('../../index')
const { TEST_DELAY, WAIT_FOR_DELAY } = require('./_constants')

// Mock file creator for example
class FileCreator {
  constructor(filePath) {
    this.filePath = filePath
    this.created = false
  }

  async createFile() {
    // Simulate file creation delay
    await new Promise(resolve => setTimeout(resolve, TEST_DELAY))
    fs.writeFileSync(this.filePath, 'Hello, World!')
    this.created = true
    return this.filePath
  }
}

async function run() {
  console.log('Starting file system operations test...')
  
  const tempDir = path.join(__dirname, 'temp')
  const filePath = path.join(tempDir, 'test.txt')
  
  // Create temp directory if it doesn't exist
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir)
  }
  
  const creator = new FileCreator(filePath)
  
  // Start file creation in background
  creator.createFile().catch(console.error)
  
  try {
    // Wait for file to be created
    const result = await waitFor({
      predicate: () => fs.existsSync(filePath),
      delay: WAIT_FOR_DELAY,
      timeout: 10000,
      onHeartbeat: (config) => {
        console.log(`Waiting for file... Attempt ${config.attempt}`)
      },
      onSuccess: () => {
        console.log('File created successfully!')
      },
      onFailure: (error) => {
        console.error('Failed to create file:', error.message)
      }
    })
    
    console.log('File is ready:', result)
    
    // Clean up
    fs.unlinkSync(filePath)
    fs.rmdirSync(tempDir)
    return result
  } catch (error) {
    console.error('File system operation failed:', error)
    // Clean up on failure
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }
    if (fs.existsSync(tempDir)) {
      fs.rmdirSync(tempDir)
    }
  }
}

if (require.main === module) {
  run().catch(console.error)
}

module.exports = {
  run,
  FileCreator
} 