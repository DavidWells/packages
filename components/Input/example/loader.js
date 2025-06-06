module.exports = function customLoader(source) {
  console.log('custom loader loaded')

  // var headerPath = path.resolve('header.js');
  const varFile = require.resolve("./src/_variables.js")
  console.log('varFile', varFile)

  this.addDependency(varFile);

  delete require.cache[varFile]

  return source
}
