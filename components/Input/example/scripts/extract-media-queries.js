const fs = require('fs').promises
const path = require('path')
const { promisify } = require('util')
const globby = require('globby')
const rimraf = require('rimraf')
const postcss = require('postcss')
const { get } = require('quick-persist')
const deleteDir = promisify(rimraf)

const logPrefix = '[Responsive CSS]: '
const noOp = () => {}

async function postProcessStyles({
  buildDirectory,
  outputPath,
  debug = false
}) {
  const logger = (args) => console.log('[Responsive CSS]:', args)
  const debugLogger = (debug) ? logger : noOp
  const tmpOutputDirectory = path.join(buildDirectory, 'responsive')
  const combinedFilePath = path.join(tmpOutputDirectory, '_combined.css')
  const tmpOutputPath = path.join(tmpOutputDirectory, '_responsive.css')

  /* Grab all outputted CSS files */
  const cssFiles = await globby([
    `${buildDirectory}/**/**.css`,
    // Exclude previous output if any
    `!${tmpOutputDirectory}/**/**.css`,
    // Exclude previous build artifact if any
    `!${outputPath}`
  ])

  if (!cssFiles.length) {
    logger(`No CSS files found in ${buildDirectory}`)
    return
  }

  if (debug) {
    const fileWord = (cssFiles.length === 1) ? 'file' : 'files'
    logger(`Found ${cssFiles.length} css ${fileWord} in build dir`)
    console.log(cssFiles)
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
    logger('Combining responsive media queries from')
    console.log(responsiveCssFiles)
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
  logger('Responsive CSS ready!', outputPath)

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
    require('postcss-extract-media-query')({
      output: {
        path: outputDirectory,
        name: '[query]-[name].[ext]'
      },
      queries: {
        'screen and (min-width: 1024px)': 'desktop'
      }
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
    await callback(array[index], index, array);
  }
}

async function run() {
  const buildHash = await get('hash')
  console.log('buildHash', buildHash)
  const BUILD_DIR = path.join(__dirname, '../build')

  await postProcessStyles({
    buildDirectory: BUILD_DIR,
    outputPath: path.join(BUILD_DIR, `static/css/responsive-${buildHash}.css`),
    debug: true
  })
}

run()