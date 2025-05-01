const fs = require('fs')
const path = require('path')
const { markdownMagic } = require('markdown-magic')

const README_PATH = path.join(__dirname, 'README.md')
const USE_CASES_DIR = path.join(__dirname, 'examples', 'use-cases')

function getUseCaseFiles() {
  return fs.readdirSync(USE_CASES_DIR)
    .filter(file => file.endsWith('.js') && !file.startsWith('_'))
    .map(file => path.join(USE_CASES_DIR, file))
}

function extractDescription(content) {
  const commentMatch = content.match(/\/\*\*([\s\S]*?)\*\//)
  if (!commentMatch) return ''
  
  // Remove the leading * and whitespace from each line, skip the first line (title)
  return commentMatch[1].trim()
    .split('\n')
    .slice(1) // Skip the first line which contains the title
    .map(line => line.replace(/^\s*\*\s?/, '').trim())
    .filter(line => line && !line.startsWith('@'))
    .join('\n')
}

function removeComment(content) {
  // Remove JSDoc comment
  let code = content.replace(/\/\*\*[\s\S]*?\*\//, '').trim()
  
  // Remove constants import
  code = code.replace(/const\s*{\s*TEST_DELAY\s*,\s*WAIT_FOR_DELAY\s*}\s*=\s*require\('\.\/_constants'\)\s*/, '\n')
  
  // Replace delay values with 1000
  code = code.replace(/TEST_DELAY/g, '1000')
  code = code.replace(/WAIT_FOR_DELAY/g, '1000')
  
  // Replace waitFor import path
  code = code.replace(/const\s*{\s*waitFor\s*}\s*=\s*require\('\.\.\/\.\.\/index'\)/, "const { waitFor } = require('@davidwells/wait-for')")
  
  // Remove trailing if and exports
  code = code.replace(/\nif \(require\.main === module\)[\s\S]*?module\.exports[\s\S]*?$/, '').trim()
  
  return code
}

function readCodeSnippet(filePath) {
  const content = fs.readFileSync(filePath, 'utf8')
  const fileName = path.basename(filePath, '.js')
  const description = extractDescription(content)
  const codeContent = removeComment(content)
  
  return `\n### ${fileName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}\n\n${description}\n\n\`\`\`javascript\n${codeContent}\n\`\`\``
}

const config = {
  transforms: {
    USE_CASES() {
      const useCaseFiles = getUseCaseFiles()
      return useCaseFiles.map(readCodeSnippet).join('\n')
    }
  }
}

// Process all markdown files in the current directory
markdownMagic([README_PATH], config)
