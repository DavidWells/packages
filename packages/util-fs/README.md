# Simple FS utils

Lightweight filesystem utilities for Node.js with promise-based API and TypeScript support.

## Install

```bash
npm install @davidwells/fs-utils
```

## Features

- ✅ Promise-based API for all operations
- ✅ TypeScript declarations included
- ✅ Comprehensive JSDoc annotations
- ✅ Recursive directory operations
- ✅ Pattern-based filtering for directory reads
- ✅ Zero dependencies (except rimraf)

## Usage

```javascript
const fs = require('@davidwells/fs-utils')

// Example: Read directory recursively, excluding node_modules
const files = await fs.readDir('./src', {
  recursive: true,
  exclude: ['node_modules', /\.test\.js$/]
})
```

## API

### File Operations

#### `fileExists(filePath)`
Check if a file or directory exists.

**Parameters:**
- `filePath` (string) - Path to check

**Returns:** `Promise<boolean>` - True if file exists, false otherwise

**Example:**
```javascript
const exists = await fs.fileExists('./package.json')
console.log(exists) // true or false
```

---

#### `readFile(filePath, options)`
Read data from a file. This is a direct export of Node.js `fs.promises.readFile`.

**Parameters:**
- `filePath` (string) - Path to file to read
- `options` (string | Object) - Encoding or options object

**Returns:** `Promise<Buffer | string>` - File contents

**Example:**
```javascript
const content = await fs.readFile('./package.json', 'utf8')
console.log(JSON.parse(content))
```

---

#### `writeFile(filePath, data, options)`
Write data to a file. This is a direct export of Node.js `fs.promises.writeFile`.

**Parameters:**
- `filePath` (string) - Path to file to write
- `data` (string | Buffer) - Data to write
- `options` (string | Object) - Encoding or options object

**Returns:** `Promise<void>`

**Example:**
```javascript
await fs.writeFile('./output.txt', 'Hello World', 'utf8')
```

---

#### `copyFile(src, dest, mode)`
Copy a file from source to destination. This is a direct export of Node.js `fs.promises.copyFile`.

**Parameters:**
- `src` (string) - Source file path
- `dest` (string) - Destination file path
- `mode` (number) - Optional copy mode flags

**Returns:** `Promise<void>`

**Example:**
```javascript
await fs.copyFile('./source.txt', './destination.txt')
```

---

#### `deleteFile(filePath)`
Delete a file, gracefully handling cases where the file doesn't exist (ignores ENOENT errors).

**Parameters:**
- `filePath` (string) - Path to file to delete

**Returns:** `Promise<void>`

**Example:**
```javascript
await fs.deleteFile('./temp.txt')
// Won't throw error if file doesn't exist
```

---

#### `getFileSize(filePath)`
Get file size information in bytes and megabytes.

**Parameters:**
- `filePath` (string) - Path to the file

**Returns:** `Promise<FileSizeResult>` - Object with `bytes` and `mb` properties

**Example:**
```javascript
const size = await fs.getFileSize('./video.mp4')
console.log(`Size: ${size.bytes} bytes (${size.mb} MB)`)
```

---

### Directory Operations

#### `directoryExists(dirPath)`
Check if a directory exists. This is an alias for `fileExists()`.

**Parameters:**
- `dirPath` (string) - Path to check

**Returns:** `Promise<boolean>` - True if directory exists, false otherwise

**Example:**
```javascript
const exists = await fs.directoryExists('./src')
```

---

#### `createDir(directoryPath, recursive)`
Create a directory, optionally creating parent directories.

**Parameters:**
- `directoryPath` (string) - Path to directory to create
- `recursive` (boolean) - Whether to create parent directories (default: `true`)

**Returns:** `Promise<void>`

**Example:**
```javascript
// Creates parent directories if they don't exist
await fs.createDir('./path/to/nested/dir')

// Only create directory if parent exists
await fs.createDir('./existing-parent/new-dir', false)
```

---

#### `readDir(dirPath, options)`
Recursively read directory contents with optional filtering.

**Parameters:**
- `dirPath` (string) - Directory path to read
- `options` (Object) - Options object
  - `recursive` (boolean) - Whether to read recursively (default: `true`)
  - `exclude` (Array<string | RegExp>) - Patterns to exclude from results (default: `[]`)

**Returns:** `Promise<string[]>` - Array of file paths

**Example:**
```javascript
// Read all files recursively
const allFiles = await fs.readDir('./src')

// Read only immediate children (non-recursive)
const topLevel = await fs.readDir('./src', { recursive: false })

// Exclude node_modules and test files
const sourceFiles = await fs.readDir('./project', {
  recursive: true,
  exclude: ['node_modules', /\.test\.js$/, /\.spec\.js$/]
})
```

---

#### `copyDir(src, dest, recursive)`
Copy a directory and its contents.

**Parameters:**
- `src` (string) - Source directory path
- `dest` (string) - Destination directory path
- `recursive` (boolean) - Whether to copy recursively (default: `true`)

**Returns:** `Promise<void>`

**Example:**
```javascript
// Copy entire directory tree
await fs.copyDir('./src', './backup')

// Copy only immediate children
await fs.copyDir('./templates', './output', false)
```

---

#### `deleteDir(dirPath)`
Recursively delete a directory and all its contents.

**Parameters:**
- `dirPath` (string) - Path to directory to delete

**Returns:** `Promise<void>`

**Example:**
```javascript
await fs.deleteDir('./temp')
```

---

## TypeScript Support

This package includes TypeScript declarations. No need to install separate `@types` packages.

```typescript
import * as fs from '@davidwells/fs-utils'

const files: string[] = await fs.readDir('./src', {
  recursive: true,
  exclude: ['node_modules']
})

const size: { bytes: number; mb: number } = await fs.getFileSize('./file.txt')
```

## Testing

This package includes a comprehensive test suite using [uvu](https://github.com/lukeed/uvu).

```bash
npm test
```

## Related Packages

- [quick-persist](https://www.npmjs.com/package/quick-persist) - Simple key-value persistence

## License

MIT
