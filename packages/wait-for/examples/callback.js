const fs = require('fs')
const { waitFor } = require('../index')

async function checkFileExists(filePath, retries, attempt) {
  console.log('Attempt:', attempt)
  console.log('Retries:', retries)
  console.log('Checking if file exists:', filePath)
  return fs.existsSync(filePath)
}

const settings = {
  delay: 1000,
  timeout: 5000
}

const predicate = ({ attempt, retries }) => checkFileExists('data.json', retries, attempt)

waitFor(predicate, settings, (err, result) => {
  if (err) {
    console.error('Callback error', err)
    return
  }
  console.log('Callback result', result)
})
//*
// Optional promise interface
.then((result) => {
  console.log('Promise result', result)
}).catch((err) => {
  console.error('Promise catch', err)
})
/** */
