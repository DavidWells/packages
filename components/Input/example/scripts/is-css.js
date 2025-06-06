const { isCSSUnit } = require('is-css-unit')
// also see https://www.npmjs.com/package/units-css

console.log(isCSSUnit('300px'))
// => true

console.log(isCSSUnit('10bark'))

console.log(isCSSUnit('10'))

function isCssUnit(value, unit = 'px') {
  if (typeof value === 'number') {
    return value + unit
  }
  if (isCSSUnit(value)) {
    return value
  }

}

console.log(isCSSUnit(10))
