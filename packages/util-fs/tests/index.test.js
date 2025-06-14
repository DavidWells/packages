const { test } = require('uvu')
const assert = require('uvu/assert')
const path = require('path')
const fs = require('fs').promises
const {
  fileExists,
  writeFile,
  readFile,
  copyFile,
  deleteFile,
  directoryExists,
  createDir,
  readDir,
  copyDir,
  deleteDir,
  getFileSize
} = require('../index.js')

// Test directory setup
const testDir = path.join(__dirname, 'temp')
const testFile = path.join(testDir, 'test.txt')
const testSubDir = path.join(testDir, 'subdir')
const testContent = 'Hello, World!'

// Setup test directory before all tests
test.before(async () => {
  try {
    await createDir(testDir)
  } catch (err) {
    // Directory might already exist
  }
})

// Cleanup after all tests
test.after(async () => {
  try {
    await deleteDir(testDir)
  } catch (err) {
    // Directory might not exist
  }
})

// Test fileExists function
test('fileExists - should return true for existing files', async () => {
  await writeFile(testFile, testContent)
  const exists = await fileExists(testFile)
  assert.is(exists, true)
  await deleteFile(testFile)
})

test('fileExists - should return false for non-existing files', async () => {
  const exists = await fileExists(path.join(testDir, 'nonexistent.txt'))
  assert.is(exists, false)
})

// Test directoryExists function (alias for fileExists)
test('directoryExists - should return true for existing directories', async () => {
  const exists = await directoryExists(testDir)
  assert.is(exists, true)
})

test('directoryExists - should return false for non-existing directories', async () => {
  const exists = await directoryExists(path.join(testDir, 'nonexistent'))
  assert.is(exists, false)
})

// Test writeFile and readFile functions
test('writeFile and readFile - should write and read file correctly', async () => {
  await writeFile(testFile, testContent)
  const content = await readFile(testFile, 'utf8')
  assert.is(content, testContent)
  await deleteFile(testFile)
})

test('writeFile and readFile - should handle binary data', async () => {
  const binaryData = Buffer.from([1, 2, 3, 4, 5])
  const binaryFile = path.join(testDir, 'binary.bin')
  
  await writeFile(binaryFile, binaryData)
  const readData = await readFile(binaryFile)
  assert.equal(readData, binaryData)
  await deleteFile(binaryFile)
})

// Test copyFile function
test('copyFile - should copy file correctly', async () => {
  const sourceFile = path.join(testDir, 'source.txt')
  const destFile = path.join(testDir, 'dest.txt')
  
  await writeFile(sourceFile, testContent)
  await copyFile(sourceFile, destFile)
  
  const sourceContent = await readFile(sourceFile, 'utf8')
  const destContent = await readFile(destFile, 'utf8')
  
  assert.is(sourceContent, destContent)
  assert.is(destContent, testContent)
  
  await deleteFile(sourceFile)
  await deleteFile(destFile)
})

// Test deleteFile function
test('deleteFile - should delete existing file', async () => {
  await writeFile(testFile, testContent)
  assert.is(await fileExists(testFile), true)
  
  await deleteFile(testFile)
  assert.is(await fileExists(testFile), false)
})

test('deleteFile - should not throw for non-existing file (ENOENT)', async () => {
  const nonExistentFile = path.join(testDir, 'nonexistent.txt')
  // Should not throw an error
  await deleteFile(nonExistentFile)
  assert.ok(true) // If we reach here, no error was thrown
})

// Test createDir function
test('createDir - should create directory', async () => {
  const newDir = path.join(testDir, 'newdir')
  await createDir(newDir)
  
  const exists = await directoryExists(newDir)
  assert.is(exists, true)
  
  await deleteDir(newDir)
})

test('createDir - should create nested directories', async () => {
  const nestedDir = path.join(testDir, 'nested', 'deep', 'dir')
  await createDir(nestedDir)
  
  const exists = await directoryExists(nestedDir)
  assert.is(exists, true)
  
  await deleteDir(path.join(testDir, 'nested'))
})

test('createDir - should not throw if directory already exists', async () => {
  await createDir(testSubDir)
  await createDir(testSubDir) // Should not throw
  
  const exists = await directoryExists(testSubDir)
  assert.is(exists, true)
  
  await deleteDir(testSubDir)
})

// Test readDir function
test('readDir - should read directory contents', async () => {
  const file1 = path.join(testDir, 'file1.txt')
  const file2 = path.join(testDir, 'file2.txt')
  
  await writeFile(file1, 'content1')
  await writeFile(file2, 'content2')
  
  const files = await readDir(testDir, { recursive: false })
  const fileNames = files.map(f => path.basename(f)).sort()
  
  assert.ok(fileNames.includes('file1.txt'))
  assert.ok(fileNames.includes('file2.txt'))
  
  await deleteFile(file1)
  await deleteFile(file2)
})

test('readDir - should read directory recursively', async () => {
  await createDir(testSubDir)
  const subFile = path.join(testSubDir, 'subfile.txt')
  const rootFile = path.join(testDir, 'rootfile.txt')
  
  await writeFile(subFile, 'subcontent')
  await writeFile(rootFile, 'rootcontent')
  
  const files = await readDir(testDir, { recursive: true })
  const relativePaths = files.map(f => path.relative(testDir, f)).sort()
  
  assert.ok(relativePaths.includes('rootfile.txt'))
  assert.ok(relativePaths.includes(path.join('subdir', 'subfile.txt')))
  
  await deleteFile(subFile)
  await deleteFile(rootFile)
  await deleteDir(testSubDir)
})

test('readDir - should exclude files based on string patterns', async () => {
  const file1 = path.join(testDir, 'include.txt')
  const file2 = path.join(testDir, 'exclude.txt')
  
  await writeFile(file1, 'content1')
  await writeFile(file2, 'content2')
  
  const files = await readDir(testDir, { 
    recursive: false, 
    exclude: ['exclude'] 
  })
  const fileNames = files.map(f => path.basename(f))
  
  assert.ok(fileNames.includes('include.txt'))
  assert.ok(!fileNames.includes('exclude.txt'))
  
  await deleteFile(file1)
  await deleteFile(file2)
})

test('readDir - should exclude files based on regex patterns', async () => {
  const file1 = path.join(testDir, 'test.js')
  const file2 = path.join(testDir, 'test.txt')
  
  await writeFile(file1, 'content1')
  await writeFile(file2, 'content2')
  
  const files = await readDir(testDir, { 
    recursive: false, 
    exclude: [/\.js$/] 
  })
  const fileNames = files.map(f => path.basename(f))
  
  assert.ok(!fileNames.includes('test.js'))
  assert.ok(fileNames.includes('test.txt'))
  
  await deleteFile(file1)
  await deleteFile(file2)
})

// Test copyDir function
test('copyDir - should copy directory and contents', async () => {
  const sourceDir = path.join(testDir, 'source')
  const destDir = path.join(testDir, 'dest')
  const sourceFile = path.join(sourceDir, 'file.txt')
  
  await createDir(sourceDir)
  await writeFile(sourceFile, testContent)
  
  await copyDir(sourceDir, destDir)
  
  const destFile = path.join(destDir, 'file.txt')
  const exists = await fileExists(destFile)
  assert.is(exists, true)
  
  const content = await readFile(destFile, 'utf8')
  assert.is(content, testContent)
  
  await deleteDir(sourceDir)
  await deleteDir(destDir)
})

test('copyDir - should copy directory recursively', async () => {
  const sourceDir = path.join(testDir, 'source')
  const sourceSubDir = path.join(sourceDir, 'subdir')
  const destDir = path.join(testDir, 'dest')
  const sourceFile = path.join(sourceSubDir, 'file.txt')
  
  await createDir(sourceSubDir)
  await writeFile(sourceFile, testContent)
  
  await copyDir(sourceDir, destDir, true)
  
  const destFile = path.join(destDir, 'subdir', 'file.txt')
  const exists = await fileExists(destFile)
  assert.is(exists, true)
  
  const content = await readFile(destFile, 'utf8')
  assert.is(content, testContent)
  
  await deleteDir(sourceDir)
  await deleteDir(destDir)
})

test('copyDir - should not copy subdirectories when recursive=false', async () => {
  const sourceDir = path.join(testDir, 'source')
  const sourceSubDir = path.join(sourceDir, 'subdir')
  const destDir = path.join(testDir, 'dest')
  const sourceFile = path.join(sourceDir, 'file.txt')
  const sourceSubFile = path.join(sourceSubDir, 'subfile.txt')
  
  await createDir(sourceSubDir)
  await writeFile(sourceFile, testContent)
  await writeFile(sourceSubFile, 'subcontent')
  
  await copyDir(sourceDir, destDir, false)
  
  const destFile = path.join(destDir, 'file.txt')
  const destSubFile = path.join(destDir, 'subdir', 'subfile.txt')
  
  assert.is(await fileExists(destFile), true)
  assert.is(await fileExists(destSubFile), false)
  
  await deleteDir(sourceDir)
  await deleteDir(destDir)
})

// Test deleteDir function
test('deleteDir - should delete directory and contents', async () => {
  const dirToDelete = path.join(testDir, 'todelete')
  const fileInDir = path.join(dirToDelete, 'file.txt')
  
  await createDir(dirToDelete)
  await writeFile(fileInDir, testContent)
  
  assert.is(await directoryExists(dirToDelete), true)
  
  await deleteDir(dirToDelete)
  
  assert.is(await directoryExists(dirToDelete), false)
})

// Test getFileSize function
test('getFileSize - should return correct file size', async () => {
  const content = 'A'.repeat(1000) // 1000 bytes
  await writeFile(testFile, content)
  
  const size = await getFileSize(testFile)
  
  assert.is(size.bytes, 1000)
  assert.is(typeof size.mb, 'number')
  assert.ok(size.mb > 0)
  
  // Check MB calculation (1000 bytes = ~0.001 MB)
  const expectedMB = Math.round((1000 / (1024 * 1024)) * 100) / 100
  assert.is(size.mb, expectedMB)
  
  await deleteFile(testFile)
})

test('getFileSize - should handle empty files', async () => {
  await writeFile(testFile, '')
  
  const size = await getFileSize(testFile)
  
  assert.is(size.bytes, 0)
  assert.is(size.mb, 0)
  
  await deleteFile(testFile)
})

test('getFileSize - should reject for non-existent files', async () => {
  const nonExistentFile = path.join(testDir, 'nonexistent.txt')
  
  try {
    await getFileSize(nonExistentFile)
    assert.unreachable('Should have thrown an error')
  } catch (err) {
    assert.ok(err.code === 'ENOENT')
  }
})

test.run()