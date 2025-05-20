const fs = require('fs').promises
const path = require('path')
const globby = require('globby')
const postcss = require('postcss')
const { getFilePaths } = require('glob-monster')
const extractMediaQueriesPlugin = require('./postcss-extract-media-query-fork')

const logPrefix = '[Responsive CSS]:'
const noOp = () => {}

function loggerMsg(msg, data) {
  console.log(logPrefix, msg)
  if (data) {
    console.log(data)
  }
}

async function createDir(directoryPath, recursive = true) {
  // ignore errors - throws if the path already exists
  return fs.mkdir(directoryPath, { recursive: recursive }).catch((e) => {})
}

module.exports = async function extractResponsiveStyles({
  buildDir,
  outputPath,
  pattern = [],
  ignore = [],
  debug = false,
  silent = false
}) {
  const logger = (silent) ? noOp : loggerMsg
  const tmpOutputDirectory = path.join(__dirname, '../responsive-css')
  const combinedFilePath = path.join(tmpOutputDirectory, '_combined.css')
  const tmpOutputPath = path.join(tmpOutputDirectory, '_responsive.css')
  const ignoreFiles = (typeof ignore === 'string') ? [ignore] : ignore
  const matchFiles = (typeof pattern === 'string') ? [pattern] : pattern

  const hasMatchPatterns = matchFiles && Array.isArray(matchFiles) && matchFiles.length
  const hasBuildDir = typeof buildDir !== 'undefined'

  if (hasMatchPatterns && hasBuildDir) {
    throw new Error('"buildDir" AND "pattern" options supplied. You must use only "buildDir" OR glob "pattern" option')
  }

  await createDir(tmpOutputDirectory)

  // Empty the tmpOutputDirectory if it exists
  try {
    const files = await fs.readdir(tmpOutputDirectory)
    await Promise.all(files.map(file => fs.unlink(path.join(tmpOutputDirectory, file))))
  } catch (err) {
    // Directory might not exist yet, which is fine
  }

  let matchPatterns
  if (hasMatchPatterns) {
    matchPatterns = matchFiles
  } else if (typeof buildDir === 'string') {
    matchPatterns = [
      `${buildDir}/**/**.css`,
    ]
  }

  const ROOT_DIR = process.cwd()
  /* Grab all outputted CSS files */
  const cssFiles = await getFilePaths(ROOT_DIR, {
    patterns: matchPatterns,
    ignore: ignoreFiles.concat([
      // Exclude previous output if any
      `!${tmpOutputDirectory}/**/**.css`,
      // Exclude previous build artifact if any
      `!${outputPath}`
    ]),
  })

  if (!cssFiles.length) {
    logger(`No CSS files found in ${buildDir}`)
    return
  }

  if (debug) {
    const fileWord = (cssFiles.length === 1) ? 'file' : 'files'
    logger(`Found ${cssFiles.length} css ${fileWord} in build dir`, cssFiles)
  }
  // console.log('cssFiles', cssFiles)

  const newCSS = cssFiles.map((filePath) => {
    return extractMediaQueries(filePath, tmpOutputDirectory)
  })

  await Promise.all(newCSS)

  /* combine all media queries into 1 file */
  const responsiveCssFiles = await globby([
    `${tmpOutputDirectory}/**/**.css`,
    `!${combinedFilePath}`,
    `!${tmpOutputPath}`,
    `!${outputPath}`
  ])
  if (debug) {
    logger('Combining responsive media queries from', responsiveCssFiles)
  }

  /* setup combined css file */
  await fs.writeFile(combinedFilePath, '')

  /* Reverse and combine CSS files */
  await asyncForEach(responsiveCssFiles.reverse(), async (filePath) => {
    // console.log('filePath', filePath)
    await combineStyles(filePath, combinedFilePath)
  })

  const result = await sortQueries(combinedFilePath, outputPath)
  if (debug) {
    await fs.writeFile(tmpOutputPath, result.css)
  }

  logger('Queries sorted!')

  await fs.writeFile(outputPath, result.css)
  logger('Responsive CSS ready!')
  logger(`Output: ${outputPath}`)

  if (!debug) {
    // clean up temporary responsive dir
    // await deleteDir(tmpOutputDirectory)
  }
}

async function sortQueries(filePath, outputPath, order = 'mobile-first') {
  const css = await fs.readFile(filePath)

  // Extract media queries
  const result = await postcss([
    require('postcss-sort-media-queries')({
      sort: order,
    })
  ]).process(css, { from: filePath, to: outputPath })
  // console.log('result', result)

  await fs.writeFile(outputPath, result.css)

  if (result.map) {
    await fs.writeFile(`${outputPath}.map`, result.map)
  }

  return result
}


async function extractMediaQueries(filePath, outputDirectory) {
  const css = await fs.readFile(filePath)
  // Extract media queries
  const result = await postcss([
    // Combine. Alt https://github.com/hail2u/node-css-mqpacker
    require('postcss-combine-media-query'),
    // Extract to seperate files
    extractMediaQueriesPlugin({
      output: {
        path: outputDirectory,
        name: '[query]-[name].[ext]'
      },
      // queries: {
      //   'screen and (min-width: 1024px)': 'desktop'
      // }
    })
  ]).process(css, { from: filePath, to: filePath })

  // console.log('result', result)
  await fs.writeFile(filePath, result.css)

  if (result.map) {
    await fs.writeFile(`${filePath}.map`, result.map)
  }
}

async function combineStyles(filePath, outputPath) {
  const addCss = await fs.readFile(filePath, 'utf-8')
  const currentCss = await fs.readFile(outputPath, 'utf-8')
  const combined = `${currentCss}\n${addCss}`
  await fs.writeFile(outputPath, combined)
  return combined
}

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array)
  }
}
