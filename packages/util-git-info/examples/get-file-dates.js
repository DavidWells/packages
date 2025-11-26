const {
  getFileModifiedDate,
  getFileCreatedDate,
  getFileDates,
  getMultipleFileDates
} = require('../src/index')

async function main() {
  console.log('=== Git File Date Examples ===\n')

  // Example 1: Get modified date only
  console.log('1. Get modified date for README.md:')
  try {
    const modifiedTimestamp = await getFileModifiedDate('README.md')
    const modifiedDate = new Date(modifiedTimestamp * 1000)
    console.log(`   Modified: ${modifiedDate.toISOString()}`)
    console.log(`   Timestamp: ${modifiedTimestamp}\n`)
  } catch (err) {
    console.log(`   Error: ${err.message}\n`)
  }

  // Example 2: Get created date only
  console.log('2. Get created date for README.md:')
  try {
    const createdTimestamp = await getFileCreatedDate('README.md')
    const createdDate = new Date(createdTimestamp * 1000)
    console.log(`   Created: ${createdDate.toISOString()}`)
    console.log(`   Timestamp: ${createdTimestamp}\n`)
  } catch (err) {
    console.log(`   Error: ${err.message}\n`)
  }

  // Example 3: Get both dates in one call (more efficient)
  console.log('3. Get both dates for README.md:')
  try {
    const dates = await getFileDates('README.md')
    console.log(`   Created: ${dates.createdDate.toISOString()}`)
    console.log(`   Modified: ${dates.modifiedDate.toISOString()}`)
    console.log(`   Age: ${Math.floor((dates.modified - dates.created) / 86400)} days\n`)
  } catch (err) {
    console.log(`   Error: ${err.message}\n`)
  }

  // Example 4: Get dates for multiple files
  console.log('4. Get dates for multiple files:')
  try {
    const files = ['README.md', 'package.json', 'src/index.js']
    const dates = await getMultipleFileDates(files)

    for (const [file, info] of Object.entries(dates)) {
      if (info.error) {
        console.log(`   ${file}: Error - ${info.error}`)
      } else {
        const age = Math.floor((Date.now() / 1000 - info.modified) / 86400)
        console.log(`   ${file}:`)
        console.log(`     Last modified: ${info.modifiedDate.toISOString()} (${age} days ago)`)
      }
    }
  } catch (err) {
    console.log(`   Error: ${err.message}`)
  }
}

main().catch(console.error)
