var postcss = require('postcss')
var helpers = require('postcss-message-helpers')
var reduceFunctionCall = require('reduce-function-call')
var maths = require('mathjs')
const { isCSSUnit } = require('is-css-unit')
var PREFIXES = maths.Unit.PREFIXES
var BASE_UNITS = maths.Unit.BASE_UNITS

// create a mathjs instance
const math = maths.create(maths.all)

var cssUnits = {
  PIXELS: 'px',
  EM: 'em',
  EX: 'ex',
  CH: 'ch',
  REM: 'rem',
  POINTS: 'pt',
  VH: 'vh',
  VW: 'vw',
  VMIN: 'vmin',
  VMAX: 'vmax'
};

Object.keys(cssUnits).forEach(function(unitKey) {
  var unit = cssUnits[unitKey];
  /* // Old way of assignment mathjs v3
  BASE_UNITS[unitKey] = {
    dimensions: [0, 1, 0, 0, 0, 0, 0, 0, 0],
    key: unitKey
  };
  math.Unit.UNITS[unit] = {
    name: unit,
    base: BASE_UNITS[unitKey],
    prefixes: PREFIXES.NONE,
    value: 1,
    offset: 0,
    dimensions: BASE_UNITS[unitKey].dimensions
  };*/

  // Add CSS units
  math.createUnit({
    [unit]: {
      baseName: BASE_UNITS[unitKey],
      prefixes: PREFIXES.NONE,
      offset: 0,
    },
  }, { override: true })
})

function strip(value) {
  return value.strip()
}

math.Unit.prototype.strip = function() {
  return this._denormalize(this.value);
};

math.import({
  strip: strip,
})

function transformResolve(value, functionName, prop) {
  return reduceFunctionCall(value, functionName, function(argString) {

    // Remove linebreaks to prevent brackets in output
    argString = argString.replace(/(\r\n|\n|\r)/gm, ' ');

    var unit = '';
    if (argString.indexOf('floor(') >= 0 || argString.indexOf('ceil(') >= 0) {
      // drop unit to apply floor or ceil function
      var start = argString.indexOf('(') + 1;
      var end = argString.indexOf(')');
      var numberWithUnit = argString.substring(start, end);


      var number = numberWithUnit.replace(
        /([^a-zA-Z]+)([a-zA-Z]*)$/, '$1'
      );
      unit = numberWithUnit.replace(/([^a-zA-Z]+)([a-zA-Z]*)$/, '$2');
      argString = argString.substring(0, start) + number + ')';
    }

    var res
    try {
      res = math.evaluate(argString);
    } catch (err) {
      const message = [
        '──────────────────────────────────────────────',
        `Error in postcss-math plugin in ${value}`,
        `Please verify rule:`,
        `>>> ${prop}: ${value}\n`,
      ]
      const errorMessage = message.join('\n')
      const throwMessage = `${errorMessage}\n${err.message}`
      console.log(errorMessage)
      err.message = throwMessage
      if (err.data && err.data.category && err.data.category === 'wrongType' && err.data.fn === 'addScalar') {
        // const ops = ['+', '-', '/', '*']
        // const argValues = argString.split(' ')
        // // console.log('argValues', argValues)
        // const tryUnit = (argValues.find((x) => isCSSUnit(x)) || '').replace(/\d+/, '')
        // console.log('Probably a missing or mismatched CSS unit in the above expression')
        // if (tryUnit) {
        //   // console.log(`Possibly missing "${tryUnit}" unit`)
        // }
        /*
         const fixedArgs = argValues.map((x) => {
           if (ops.includes(x)) {
             return x
           }
           if (isCSSUnit(x)) {
             return x
           }
           return `${x}${tryUnit}`
         })
         const newArgs = fixedArgs.join(' ').trim()
        */
      }
      throw err
    }
    // Add previous splitted unit if any
    var formatted = res.toString() + unit;
    // Math.JS puts a ^2 on multi muliplication... drop it.
    formatted = formatted.replace(/\^\d+/, '')
    // Math.JS puts a space between numbers and units, drop it.
    formatted = formatted.replace(/(.+) ([a-zA-Z]+)$/, '$1$2')
    return formatted;
  })
}

module.exports = (opts = {}) => {
  opts = opts || {};

  var functionName = 'resolve';
  if (opts.functionName) {
    functionName = opts.functionName
  }

  var match = functionName + '(';

  // Transform a single node property (value/params/selector) if it contains resolve()
  function transformNode(node, nodeProp) {
    if (!node[nodeProp] || node[nodeProp].indexOf(match) === -1) {
      return;
    }
    node[nodeProp] = helpers.try(function() {
      return transformResolve(node[nodeProp], functionName, node.prop);
    }, node.source);
  }

  // Per-node visitors (PostCSS 8) so this runs in plugin order relative to other
  // visitor plugins — e.g. after postcss-simple-vars substitutes $vars. The old
  // `Once` whole-tree walk ran before visitor plugins, so $vars inside resolve()
  // were not yet substituted.
  return {
    postcssPlugin: 'postcss-math',
    Declaration(decl) {
      transformNode(decl, 'value');
    },
    AtRule(atRule) {
      if (atRule.name === 'media') {
        transformNode(atRule, 'params');
      }
    },
    Rule(rule) {
      transformNode(rule, 'selector');
    },
  }
};

module.exports.postcss = true
