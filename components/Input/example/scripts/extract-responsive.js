const path = require('path')
const { getHash } = require('webpack-persist-build-hash')
const extractResponsiveStyles = require('extract-responsive-styles')

const { execSync } = require("child_process");

function codeVersion() {
  return execSync("git rev-parse --short HEAD").toString().trim();
}

async function runPostBuild() {
  const buildHash = codeVersion()
  console.log('buildHash', buildHash)
  const BUILD_DIR = path.join(__dirname, '../build')

  await extractResponsiveStyles({
    buildDirectory: BUILD_DIR,
    outputPath: path.join(BUILD_DIR, `static/css/responsive-${buildHash}.css`),
    debug: true
  })
}

runPostBuild()
