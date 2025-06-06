const tinycolor = require('tinycolor2')
const color = require('color')

module.exports = {
  darken(value) {
    return 'chill' + value
  },
  // https://github.com/vusion/vue-cli-plugin-vusion/blob/1324dca218a727f0c4b1780ed6be22ce7ada3ca1/webpack/getPostcssPlugins.js#L41
  mix(c1, c2, ratio = 0.5) {
      ratio = fixRatio(ratio);
      const mixed = color(c1).mix(color(c2), ratio);
      return mixed.alpha() < 1 ? mixed.string() : mixed.hex();
  },
  lighten(c, ratio) {
      ratio = fixRatio(ratio);
      return color(c).lighten(ratio);
  },
  darken(c, ratio) {
      ratio = fixRatio(ratio);
      return color(c).darken(ratio);
  },
  saturate(c, ratio) {
      ratio = fixRatio(ratio);
      return color(c).saturate(ratio);
  },
  desaturate(c, ratio) {
      ratio = fixRatio(ratio);
      return color(c).desaturate(ratio);
  },

  // https://github.com/krambuhl/rainbow-trip/blob/9d5c1efd5d90679d1283afef9edd855c53fd87f9/postcss.config.js#L9
  // https://github.com/krambuhl/rainbow-trip/blob/9d5c1efd5d90679d1283afef9edd855c53fd87f9/styles/variables/type.css#L74
  responsive(min, max, rangeMin, rangeMax) {
    return `
      calc(
        ${min} + (${parseFloat(max)} - ${parseFloat(min)}) *
        ((100vw - ${rangeMin}) / (${parseInt(rangeMax, 10)} - ${parseInt(rangeMin, 10)}))
      )
    `
  },
  // https://github.com/c-is/suade/blob/ec09b48841ef877cabdb7290f0911c1d73d7642d/gulpfile.babel.js#L59
  grid: ($width, $columns, $margin) => ($width / $columns) - ($margin * 2),
  'strip-units': $value => $value / (($value * 0) + 1),
  // https://github.com/JustynaJuza/HomeHUD/blob/55868a1f6a80952e8535322321c1141d9d7bbf49/HomeHUD/webpack.config.settings.js#L16
  // text-shadow: longTextShadow(3, 16, #333);
  longTextShadow(offset, length, color) {
    var formatSingleRow = function(index, color) {
        return index + 'px ' + index + 'px 0 ' + color;
    }

    var values = [];
    for (var i = parseInt(offset); i <= parseInt(length); i++){
        values.push(formatSingleRow(i, color));
    }

    return values.join(',')
  },
  // https://github.com/MJones180/PhenominalApp/blob/5d2aacfb45c06da976d8eb96ebccc1221becca4f/src/styles/functions.js#L13
  image: route => `url("https://picture-assets.s3.amazonaws.com/${route}")`,
  // https://github.com/arxpoetica/stallion/blob/44fdfad775b0cfbd019ae1c6feb8720de2b5957c/src/_server/build/postcss.config.vars.js#L32
  tinycolor: (color, method, ...theArgs) => {
    return tinycolor(color)[method](...theArgs)/* .toString() */
  },
  ratio: (divider, divided) => {
    return Number((divider / divided * 100).toFixed(3)) + '%'
  },
  // https://github.com/WendelSimoes/grupo-agile-website/blob/8915caa2c1e8df866154470001e9e157fe6f4b30/public/css/tailwindcss/lib/lib/evaluateTailwindFunctions.js#L115-L128
}


function fixRatio(ratio) {
  if (ratio.endsWith('%')) {
    return ratio.replace('%', '') / 100;
  }
  return ratio;
};

/*
 * parse map into hash and indexes array
 * parseMap('x:cool, y:ok')
 */
function parseMap(map) {
  var hash = {}
  var indexes = []
  map.replace(/(\(|\)|\r\n|\n|\r)/gm, '').split(',').forEach(function(el, index){
    var param = el.split(':')
    var key = param[0] && param[0].trim()
    hash[key] = param[1] && param[1].trim()
    indexes[index] = key
  })
  return {hash: hash, index:indexes}
}

function mapToHash(map) {
  return parseMap(map).hash
}

function getMapKeys() {
  return parseMap(map).index
}

/*
Good example https://github.com/OEvgeny/bootstrap-postcss/blob/ba33c2dfb165a7aa4a4f6a238d9e9757f4d821b2/src/functions.js
*/

/*
isLight
https://github.com/subpopular/sassyboi/blob/35e0c3a20282371c03562b133506e04c79030a6d/src/style-functions.js#L3
*/

// https://github.com/XpageTeam/arena/blob/d4fb565bc25a16e10479bb443259455092b38463/config/postcss/functions.js

// https://github.com/prudencss/postcss/tree/c2c267c693fc14c08f4d56f62b9f64b23eae1bea/src/functions


/*
// https://github.com/ivanvotti/things-clone/blob/3cc3ae676cdc3a10ff76057405c08690f31fb7a7/ember-cli-build.js#L5
function pixelsToUnit(pixels, unit, context = '16px') {
  return `${parseInt(pixels, 10) / parseInt(context, 10)}${unit}`;
}

const postcssUnitsFunctions = {
  em: (pixels, context) => pixelsToUnit(pixels, 'em', context),
  rem: (pixels, context) => pixelsToUnit(pixels, 'rem', context)
};
*/

/*
Inline fonts

https://github.com/robwierzbowski/rw-vue/blob/817f90f0e5214e90f737de2486803a4a7dc0dff4/.postcssrc.js#L14
const fs = require('fs');
const mime = require("mime");
const path = require("path");
"postcss-functions": {
  functions: {
    "inline-font": function(url) {
        url = `src/${JSON.parse(url)}`;
        const ext = path.extname(url);
        const mimetype = mime.getType(ext);
        const mimestring = mimetype ? `${mimetype};` : '';
        const data = fs.readFileSync(url, 'base64');

        return `url(data:${mimestring}charset=utf-8;base64,${data})`;
    },
  },
},
*/

/*
// https://css-tricks.com/molten-leading-css/
// https://github.com/andi1984/blog/blob/b0ff285944d7df12c3c0617fc9b7664cbe7811bd/src/css/functions/moltenleading.js
// 21em "gate" * 1.15 font-size
@mixin lowergate {
  p {
    line-height: moltenleading(
      var(--lower-gate),
      var(--lower-gate-unitless),
      var(--upper-gate),
      var(--upper-gate-unitless),
      var(--min-lineheight),
      var(--min-lineheight-unitless),
      var(--max-lineheight),
      var(--max-lineheight-unitless),
    );
  }
}
 function moltenLeading(
  lowerGate,
  lowerGateUnitless,
  upperGate,
  upperGateUnitless,
  minLineHeight,
  minLineHeightUnitles,
  maxLineHeight,
  maxLineHeightUnitless
) {
  return `calc(${minLineHeight} + (${maxLineHeightUnitless} -
    ${minLineHeightUnitles}) * ((100vw - ${lowerGate}) / (${upperGateUnitless} - ${lowerGateUnitless})))`;
};
*/


/*
import _ from 'lodash'
import functions from 'postcss-functions'

export default function(config) {
  return functions({
    functions: {
      theme: (path, ...defaultValue) => {
        return _.thru(_.get(config.theme, _.trim(path, `'"`), defaultValue), value => {
          return Array.isArray(value) ? value.join(', ') : value
        })
      },
    },
  })
}
*/


/*
Color
https://github.com/jpgorman/counselling/blob/e8493698f67f6691f042c3e4964d9dd7d9dd8e4a/resources/postcss-functions/get-color.js
*/
