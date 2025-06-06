const Color = require('color')
const validateColor = require("validate-color").default
const dedent = require('dedent')

let GLOBAL_TOKENS
module.exports = (tokens) => {
  GLOBAL_TOKENS = tokens

  return {
    /* clear floats */
    clearfix: {
      '&::after': {
        content: '""',
        display: 'table',
        clear: 'both'
      }
    },
    /* Disable selectable text */
    noSelect: {
      '-webkit-touch-callout': 'none',
      '-webkit-user-select': 'none',
      '-khtml-user-select': 'none',
      '-moz-user-select': 'none',
      '-ms-user-select': 'none',
      'user-select': 'none'
    },
    /* stripe background */
    stripedBackground: {
      'background': 'repeating-linear-gradient(25deg, #2e303d, #2e303d 120px, #2a2c39 20px, #2a2c39 330px);',
      /*'background-image': `linear-gradient(32deg, rgb(46, 48, 61) 14.29%,
        rgb(42, 44, 57) 14.29%,
        rgb(42, 44, 57) 50%,
        rgb(46, 48, 61) 50%,
        rgb(46, 48, 61) 64.29%, rgb(42, 44, 57) 64.29%,
        rgb(42, 44, 57) 100%)
      `,
      'background-size': '158.51px 99.05px'*/
    },
    /* Truncate text... */
    truncate: {
      overflow: 'hidden',
      'text-overflow': 'ellipsis',
      'white-space': 'nowrap',
    },
    /* Wrap words  */
    wordWrap: {
      'overflow-wrap': 'break-word',
      'word-wrap': 'break-word'
    },
    /* Set placeholder text color  */
    placeholderColor: (_args, color) => {
      return {
        /* Chrome/Opera/Safari */
        '&::-webkit-input-placeholder': {
          'color': color
        },
        /* Firefox 19+ */
        '&::-moz-placeholder': {
          'color': color
        },
        /* IE 10+ */
        '&:-ms-input-placeholder': {
          'color': color
        },
        /* Firefox 18- */
        '&:-moz-placeholder': {
          'color': color
        },
      }
    },
    /* Box shadows */
    shadows: (size) => {
      const shadows = {
        smallest: '0px 4px 8px rgba(0,0,0,0.12)',
        small: '0 5px 10px rgba(0,0,0,0.12)',
        medium: '0 8px 30px rgba(0,0,0,0.12)',
        large: '0 30px 60px rgba(0,0,0,0.12)',
      }
      return {
        'box-shadow': shadows[size] || shadows.smallest
      }
    },
    /* Highlight and wobble */
    debug: () => {
      return {
        '&': {
          'animation': `debugWobble 0.5s ease-in-out alternate infinite`
        },
        '@keyframes debugWobble': {
          '0%': {
            'box-shadow': 'inset 4px 4px rgb(236, 15, 170), inset -4px -4px rgb(236, 15, 170)'
          },
          '100%': {
            'box-shadow': 'inset 8px 8px rgb(236, 15, 170), inset -8px -8px rgb(236, 15, 170)'
          },
        }
      }
    },
    /* visually hidden */
    visuallyHidden: {
      position: 'absolute',
      top: 'auto',
      left: '-10000px',
      width: '1px',
      height: '1px',
      overflow: 'hidden',
    },
    overlay(_, opacity = 0, color = tokens.primary) {
      return {
        position: 'fixed',
        top: '0',
        bottom: '0',
        left: '0',
        right: '0',
        zIndex: 99,
        'background-color': ensureColor(color),
        visibility: (opacity === 0) ? 'hidden' : 'visible',
        opacity: formatOpacity(opacity),
        transition: '.5s'
      }
    },
    // https://github.com/Datawheel/authority-health/blob/ef35fb353220b058d280eed67a0638a7ac472459/app/css/mixins.css#L142
    fullwidthSection: () =>{
      return {
        'margin-left': 'auto',
        'margin-right': 'auto',
        'margin-left': 'calc(-50vw + 50%)',
        'margin-right': 'calc(-50vw + 50%)',
      }
    },
    fullwidthPseudo: () => {
      return {
        /* pseudo stuff */
        content: "",
        display: 'block',
        /* positioning & sizing */
        position: 'absolute',
        /* fill container height */
        top: 0,
        bottom: 0,
        height: '100%',
        /* fill page width */
        left: 'calc(-50vw + 50%)',
        right: 'calc(-50vw + 50%)',
        'min-width': '100%',
        'z-index': -1, /* behind content */
      }
    },
    /* using @mixin-content example */
    isIe: function () {
      return {
        'background': 'blue',
        '@mixin-content': {},
      }
    },
    fullScreenGrid: (mixin, type = 'golden') => {
      const styleSet = {
        display: 'grid',
        position: 'relative',
        height: '100vh',
        width: '100%',
        '@mixin-content': {}
      }

      if (type === 'golden') {
        Object.assign(styleSet, {
          'grid-template-rows':
            // eslint-disable-next-line max-len
            '1fr 1fr 2fr 4fr 2.66fr 5.33fr 5.33fr 4.33fr 2.83fr 3.5fr 3.5fr 2.83fr 4.33fr 5.33fr 5.33fr 2.66fr 4fr 2fr 1fr 1fr',
          'grid-template-columns':
            // eslint-disable-next-line max-len
            '1fr 1fr 2fr 4fr 2.66fr 5.33fr 5.33fr 4.33fr 2.83fr 3.5fr 3.5fr 2.83fr 4.33fr 5.33fr 5.33fr 2.66fr 4fr 2fr 1fr 1fr'
        });
      }
      return styleSet;
    },
    /**
     * Create a scrollbar
     * @param  {object} _  - all information from postCSS
     * @param  {string} width - param from mixin
     * @return {object} - adds scrollbar CSS to element
     * Usage:
     *  .detail-inner {
     *    @mixin scrollBar 10px; // width = 10px
     *    padding: 30px;
     *  }
     */
    scrollBar: function scrollbar(_, width) {
      return {
        '&::-webkit-scrollbar': {
          height: width,
          overflow: 'visible',
          width: width,
        },
        '&::-webkit-scrollbar-track': {
          'background-clip': 'padding-box',
          width: width,
          'border-width': '0 0 0 0px',
          'background-color': 'rgba(255, 255, 255, 1)',
          'box-shadow': 'inset 1px 0 0 rgba(0, 0, 0, 0.1)',
        },
        '&::-webkit-scrollbar-track:horizontal': {
          'border-width': '0px 0 0',
        },
        '&:hover::-webkit-scrollbar-track': {
          'box-shadow': 'inset 1px 0 0 rgba(0, 0, 0, 0.1)',
        },
        '&::-webkit-scrollbar-track:active': {
          'background-color': 'rgba(0, 0, 0, 0.035)',
          'box-shadow': 'inset 1px 0 0 rgba(0, 0, 0, 0.1)',
        },
        '&::-webkit-scrollbar-button:start:decrement': {
          display: 'block',
        },
        '&::-webkit-scrollbar-button:end:increment': {
          display: 'block',
        },
        '&::-webkit-scrollbar-button:vertical:start:increment': {
          display: 'none',
        },
        '&::-webkit-scrollbar-button:vertical:end:decrement': {
          display: 'none',
        },
        '&::-webkit-scrollbar-thumb': {
          'min-height': '28px',
          'padding-top': '100px',
          'background-clip': 'padding-box',
          'background-color': 'rgba(0, 0, 0, 0.2)',
          'box-shadow': 'inset 1px 1px 0 rgba(0, 0, 0, 0.1), inset 0 -1px 0 rgba(0, 0, 0, 0.07)'
        },
        '&::-webkit-scrollbar-thumb:hover': {
          'background-color': 'rgba(0, 0, 0, .4)',
          'box-shadow': 'inset 1px 1px 1px rgba(0, 0, 0, 0.25)',
        },
        '&::-webkit-scrollbar-thumb:active': {
          'box-shadow': 'inset 1px 1px 3px rgba(0, 0, 0, 0.35)',
          'background-color': 'rgba(0, 0, 0, .5)',
        },
        '&::-webkit-scrollbar-thumb:vertical': {
          border: '0 solid transparent',
          'border-left': '0px solid transparent',
        },
        '&::-webkit-scrollbar-thumb:horizontal': {
          border: '0 solid transparent',
          'border-top': '0px solid transparent',
        },
        '&::-webkit-scrollbar-button': {
          height: 0,
          width: 0,
        }
      }
    },
    // https://github.com/moca-salter/monicasalter.com/blob/e20edbc082914e551c93d966c95d221f7e4599d4/themes/mcsalter/src/precss/mixins/_positioning.css#L41
    marginClearing() {
      /* margin clearing
      @define-mixin child-margin-clear {
        > *:first-child {
          margin-top: 0;
        }
        > *:last-child {
          margin-bottom: 0;
        }
      }

      @define-mixin child-margin-clear-first {
        > *:first-child {
          margin-top: 0;
        }
      }

      @define-mixin child-margin-clear-last {
        > *:last-child {
          margin-bottom: 0;
        }
      }
      */
    },
    animation(_, speed = '250ms', kind = 'all', easing = 'ease') {
      return {
        transition: `${kind} ${speed} ${easing}`
      }
    },
    noAnimation: {
      transition: 'none'
    },
    /* src https://www.joshwcomeau.com/snippets/html/scale-with-pseudoelements/ */
    scaleOnHover(_, scale = '1.1', background) {
      return {
        position: 'relative',
        '&:after': {
           background: background || 'inherit',
           content: '""',
           position: "absolute",
           top: "0",
           left: "0",
           right: "0",
           bottom: "0",
           zIndex: -1,
           transition: "transform 250ms"
        },
        '&:hover::after': {
          transform: `scale(${scale})`
        }
      }
    },
    // Style external links
    externalLink(_) {
      const selector = dedent`
        &[href^="http://"],
        &[href^="https://"],
        &[rel^="external"]
      `
      return {
        [selector]: {
          '@mixin-content': {},
        }
      }
    },
    inside(_, parentSelectors = '', childrenSelector = '') {
      // console.log(require('util').inspect(_.nodes[0].raws, {showHidden: false, depth: null}))
      return {
        [`@nest ${parentSelectors} & ${childrenSelector}`]: {
          '@mixin-content': {},
        }
      }
    },
    theme(_, kind = 'dark', extraSelectors = '') {
      const hasParent = _ && _.parent && _.parent.selector
      // console.log('xyz', _)
      let selector = `@nest html[data-theme="${kind}"] ${extraSelectors} &`
      if (!hasParent) {
        selector = `html[data-theme="${kind}"] ${extraSelectors}`
      }

      // console.log(require('util').inspect(_.nodes[0].raws, {showHidden: false, depth: null}))
      return {
        [`${selector}`]: {
          '@mixin-content': {},
        }
      }
    },
    /**
     * Colorscheme mixin
     * @param {*} _
     * @param {*} $bgColor
     * @param {*} $color
     * @usage:
     * @mixin colorScheme black, white;
     */
    colorScheme(_, $bgColor, $color) {
      const pseudo = {
        'background-color': $bgColor,
        color: $color
      }
      return {
        'background-color': $bgColor,
        'color': $color,
        '&::before': pseudo,
        '&::after': pseudo
      }
    },
    // Background images used for full-width cover.
    backgroundCover(_, imagePath = false, backgroundTop = 'center', backgroundLeft = 'center') {
      return {
        ...(imagePath) ? { 'background-image': `url(${imagePath})` } : {},
        'background-repeat': 'no-repeat',
        'background-size': 'cover',
        'background-position': `${backgroundTop} ${backgroundLeft}`,
        '@mixin-content': {}
      }
    },
    /* Inline border mixins */
    borderInsetCustom: borderInset,
    borderInsetTop(_, top, color) {
      return borderInset(_, top, 0, 0, 0, color)
    },
    borderInsetBottom(_, bottom, color) {
      return borderInset(_, 0, 0, bottom, 0, color)
    },
    borderInsetRight(_, right, color) {
      return borderInset(_, 0, right, 0, 0, color)
    },
    borderInsetLeft(_, left, color) {
      return borderInset(_, 0, 0, 0, left, color)
    },
    borderInsetX(_, width, color) {
      return borderInset(_, 0, width, 0, width, color)
    },
    borderInsetY(_, height, color) {
      return borderInset(_, height, 0, height, 0, color)
    },
    borderInset(_, width = 1, color) {
      return borderInset(_, width, width, width, width, color)
    },
    /* Pseudo Elements */
    pseudo(_, width = '100%', height = '100%', display = 'inline-block', pos = 'absolute', content = "''") {
      return pseudo(_, width, height, display, pos, content)
    },
    pseudoBefore(_, width = 'auto', height = '100%', display = 'inline-block', pos = 'absolute', content = "'xx'") {
      return {
        ...pseudo(_, width, height, display, pos, content),
        right: '100%',
      }
    },
    pseudoAfter(_, width = 'auto', height = '100%', display = 'inline-block', pos = 'absolute', content = "'xx'") {
      return {
        ...pseudo(_, width, height, display, pos, content),
        left: '100%',
      }
    }
    // N of X helpers https://github.com/LukyVj/family.scss/blob/master/source/src/_family.scss

    // Width calculations https://github.com/mobify/spline/blob/develop/dist/utilities/dimensions/_dimensions.scss
  }
}

function pseudo(_, width = '100%', height = '100%', display = 'inline-block', pos = 'absolute', content = "''") {
  return {
    content: `${content}`,
    display: `${display}`,
    position: `${pos}`,
    width: `${width}`,
    height: `${height}`,
  }
}

function borderInset(_, top, right, bottom, left, _color) {

  const color = ensureColor(_color)
  const gradient = `${color} 0%, ${color} 50%, ${color} 100%`
  return {
    'background-image': `
      linear-gradient(180deg, ${gradient}),
      linear-gradient(90deg,  ${gradient}),
      linear-gradient(0deg,   ${gradient}),
      linear-gradient(90deg,  ${gradient})`,
    'background-size': `
      100% ${ensurePx(top)},
      ${ensurePx(right)} 100%,
      100% ${ensurePx(bottom)},
      ${ensurePx(left)} 100%`,
    'background-repeat': 'no-repeat',
    'background-position': 'top, right top, bottom, left top'
  }
}


/* UTils */

function atLeastOne(unit) {
  const value = Number(unit)
  if (!isNaN(value) && value < 1) {
    return 1
  }
  return unit
}

function formatOpacity(opacity) {
  return (opacity > 1) ? opacity / 100 : opacity
}

function ensurePx(unit) {
  const value = Number(unit)
  if (!isNaN(value)) {
    return String(unit) + 'px'
  }
  if (unit.indexOf('px') === -1) {
    return unit + 'px'
  }
  return unit
}

// Ensure colors are valid
function ensureColor(color, defaultColor) {
  if (validateColor(color)) {
    return color
  }
  const hexifyColor = `#${color}`
  if (validateColor(hexifyColor)) {
    return hexifyColor
  }
  if (defaultColor) {
    return defaultColor
  }
  if (GLOBAL_TOKENS && GLOBAL_TOKENS[color]) {
    return GLOBAL_TOKENS[color]
  }
  // Else throw error
  throw new Error(`Invalid color "${color}" passed`)
}
/*
// CSS variable shortcuts
// Type mixins https://github.com/5310/footoscope.club/blob/43dc3655e7deb5746f7a8a91dbeb22007e3056f8/src/content/mock/index.css#L58
@define-mixin type $name {
  font-size: var(--type-$(name)-size, 1em);
  font-weight: var(--type-$(name)-weight, 400);
}
// usage:
:root {
  --f3: 1.953rem;
  --type-headline-3-size: var(--f3);
  --type-headline-3-weight: 700;
}
h1 {
  @mixin type headline-3;
}


// Visibility
@define-mixin hide {
  opacity: 0;
  visibility: hidden;
}

@define-mixin show {
  opacity: 1;
  visibility: visible;
}

// Layout
@define-mixin fullscreen {
  min-height: 100vh;
  margin-left: 0;
  margin-right: 0;
}

// Layout
@define-mixin center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
@define-mixin centerVertical {
  top: 50%;
  transform: translateY(-50%);
}
@define-mixin centerHorizontal {
  left: 50%;
  transform: translateX(-50%);
}
@define-mixin centerText {
  text-align: center;
  margin-left: auto;
  margin-right: auto;
}

@define-mixin box $width, $height: $width {
  width: $(width);
  height: $(height);
}

//  Colors Toolkit
@define-mixin colorScheme $bgColor, $color {
  background-color: $bgColor;
  color: $color;

  &::before,
  &::after {
    background-color: $bgColor;
    color: $color;
  }
}

// Supports Toolkit
// usage https://github.com/wwwsolutions/mendas-dev-portfolio-refactor/blob/28a687e7becde775b187b9f0d0d5be1a328e8fbc/src/styles/base/_layout.css#L2
@define-mixin supportsGrid {
  @supports (grid-area: auto) {
    @mixin-content;
  }
}
@define-mixin supportsBgClip {
  @supports (-webkit-background-clip: text) {
    @mixin-content;
  }
}

// List spacing
@define-mixin listSpacing {
  padding-left: var(--space-700);
  margin-bottom: var(--space-600);

  & ol, & ul {
    margin-bottom: 0;
  }

  & > *:first-child {
    margin-top: 0;
  }
  & > *:last-child {
    margin-bottom: 0;
  }
}

@define-mixin element-ul {
  @mixin listSpacing;
  list-style: disc;

}

@define-mixin element-ol {
  @mixin listSpacing;
  list-style: number;
}

// animation

@define-mixin fadeIn $duration, $timing {
  transition: opacity $duration $timing, visibility 0s $timing;
}
@define-mixin fadeOut $duration, $timing {
  transition: opacity $duration $timing, visibility 0s $timing $duration;
}

@define-mixin offset-border {
  &:before, &:after {
    content: "";
    display: block;
    width: 80px;
    border-top: 1px solid #ddd;
    margin: 20px auto 20px auto;
  }
}
// https://github.com/c-is/suade/blob/ec09b48841ef877cabdb7290f0911c1d73d7642d/src/css/mixins/_position.css
*/

// Content sizes
// https://github.com/feelfoundation/gcc-desktop/blob/ccdb93abca4f65fe5f8d5d25285cffee2ff17035/src/app/mixins.css#L1


/*
fullwidth container
https://github.com/Datawheel/authority-health/blob/ef35fb353220b058d280eed67a0638a7ac472459/app/css/mixins.css#L143
*/

/*
@define-mixin contentNormal
https://github.com/feelfoundation/feel-desktop/blob/08db05ff0e96ee94ba126c1d09ea8ccc22dad8ca/src/app/mixins.css#L17
*/

/*
contrain images? https://github.com/FlynnLeeGit/sfddmobile/blob/b0b8535446bc9778380c793c4739ee1b34906973/src/style/mixins.css#L14
@define-mixin px2w $px {
  width: calc( $(px)/ 750 * 100vw);
}

@define-mixin px2h $px {
  height: calc( $(px)/ 1334 * 100vh);
}
*/

/*
@define-mixin add-custom-font $fontName, $pathToFont, $fileName {
    @font-face {
        font-family: $fontName;
        src: url("$(pathToFont)/$(fileName).eot");
        src: url("$(pathToFont)$(fileName).eot?#iefix") format('embedded-opentype'),
        url("$(pathToFont)/$(fileName).ttf") format('truetype'),
        url("$(pathToFont)/$(fileName).woff") format('woff'),
        url("$(pathToFont)/$(fileName).svg") format('svg');

        @mixin-content;
  	}
}

*/


/*
GRID
https://cherry.design/css/cherry-grid

https://github.com/abyMosa/elmboiler/blob/a1da27214d7b72ad9846cb653d1b8fc29c1326b2/src/assets/css/mixins/grid.css#L13

@define-mixin make-container {
    margin-right: auto;
    margin-left: auto;
    // padding-right: 15px;
    padding-left:  15px;
    display: flex;
    flex-direction: column;
    max-width: 1200px;
    width: 100%;
}

@define-mixin make-layout {
    width: 100%;
    display: flex;
    flex-wrap: wrap;
    flex-direction: row;
    justify-content: space-between;
}

@define-mixin make-col-ready {
    position: relative;
    width: 100%;
    min-height: 1px;
    // flex-direction: column;
}

@define-mixin make-col $size{
    flex-basis: calc( ($size / 12) * 100% );
    max-width: calc( ($size / 12) * 100% );
}

@define-mixin make-col-with-gutter $size, $gutter{
    flex-basis: calc( ( ($size / 12) * 100% ) - $(gutter)*5px );
    max-width: calc( ( ($size / 12) * 100% ) - $(gutter)*5px );
}
@define-mixin make-col-with-gutter-flex-start $size, $gutter{
    max-width: calc( ( ($size / 12) * 100% ) );
    flex-basis: calc( ( ($size / 12) * 100% ) );
    padding-right: calc( $(gutter)*5px /2 );
    padding-left: calc( $(gutter)*5px /2 );
}

@define-mixin make-col-offset $size{
    margin-left: calc( ($size / 12) * 100% );
}
*/

/*
Hairline borders
@define-mixin top_1px $color {
    position: relative;
    &:after {
        border-top:1px solid $color;
        width:200%;
        height:200%;
        position:absolute;
        top:0;
        left:0;
        z-index:0;
        content:"";
        transform:scale(0.5);
        transform-origin:0 0;
        box-sizing:border-box;
    }
}

@define-mixin right_1px $color {
    position: relative;
    &:after {
        border-right:1px solid $color;
        width:200%;
        height:200%;
        position:absolute;
        top:0;
        left:0;
        z-index:0;
        content:"";
        transform:scale(0.5);
        transform-origin:0 0;
        box-sizing:border-box;
    }
}

@define-mixin bottom_1px $color {
    position: relative;
    &:after {
        border-bottom:1px solid $color;
        width:200%;
        height:200%;
        position:absolute;
        top:0;
        left:0;
        z-index:0;
        content:"";
        transform:scale(0.5);
        transform-origin:0 0;
        box-sizing:border-box;
    }
}


@define-mixin left_1px $color {
    position: relative;
    &:after {
        border-left:1px solid $color;
        width:200%;
        height:200%;
        position:absolute;
        top:0;
        left:0;
        z-index:0;
        content:"";
        transform:scale(0.5);
        transform-origin:0 0;
        box-sizing:border-box;
    }
}

@define-mixin all_1px $color {
    position: relative;
    &:after {
        border:1px solid $color;
        width:200%;
        height:200%;
        position:absolute;
        top:0;
        left:0;
        z-index:0;
        content:"";
        transform:scale(0.5);
        transform-origin:0 0;
        box-sizing:border-box;
    }
}
*/

/*
Ghost buttons
https://github.com/egoist/hack/blob/b2b7c5f0f411520651ae3995e66d574bf28ff98f/src/css/mixins.css#L6
*/

/*
Transitions
https://github.com/bendyorke/pushupsio/blob/610cc966dbba2ccab11272f5049b9f4001aca61a/app/css/base/mixins.css#L76
https://github.com/bendyorke/pushupsio/blob/610cc966dbba2ccab11272f5049b9f4001aca61a/app/css/Account.css#L19

*/

/*
https://github.com/callumflack/callum-flack-blog/blob/6f94ae06f7cf9e4ff8ad548d6ef2bd999c3cadd7/assets/styles/utilities/helpers.css#L104
  reset of all properties…
  1. to initial values
  2. to inheritable values, or else initial values

@define-mixin is-initial {
  all: initial;
}

@define-mixin is-unset {
  all: unset;
}
*/

/*
// media queries
@define-mixin at380 {
  @media (min-width: 380px) {
    @mixin-content;
  }
}
@define-mixin mq $break {
  @media (min-width: $break) { @mixin-content; }
}

@define-mixin mq-max $break {
  @media (max-width: $break) { @mixin-content; }
}
*/


/*
CSS arrows
https://github.com/zengzih/layout-ui/blob/dcae7c16ac13ec5521d4eedc3cf91551d130b959/src/styles/postcss/mixins/sc.mixins.util.css#L114
@define-mixin setTopArrow $arrowsize $borderWidth $borderColor {
	display: inline-block;
    height: $arrowsize;
    width: $arrowsize;
    border-width: $borderWidth $borderWidth 0 0;
    border-color: $borderColor;
    border-style: solid;
    / rotate(-45deg);
    transform: matrix(0.71,-0.71,0.71,0.71,0,0);

    position: relative;
    top: -2px;
}

@define-mixin setRightArrow $arrowsize $borderWidth $borderColor {
	display: inline-block;
    height: $arrowsize;
    width: $arrowsize;
    border-width: $borderWidth $borderWidth 0 0;
    border-color: $borderColor;
    border-style: solid;

    transform: matrix(0.71,0.71,-0.71,0.71,0,0); // rotate(45deg);

    position: relative;
    top: -2px;
}

@define-mixin setDownArrow $arrowsize $borderWidth $borderColor {
	display: inline-block;
    height: $arrowsize;
    width: $arrowsize;
    border-width: $borderWidth $borderWidth 0 0;
    border-color: $borderColor;
    border-style: solid;

    transform: matrix(-0.71,0.71,-0.71,-0.71,0,0); // rotate(135deg);

    position: relative;
    top: -2px;
}

@define-mixin setLeftArrow $arrowsize $borderWidth $borderColor {
	display: inline-block;
    height: $arrowsize;
    width: $arrowsize;
    border-width: $borderWidth $borderWidth 0 0;
    border-color: $borderColor;
    border-style: solid;

    transform: matrix(-0.71,-0.71,0.71,-0.71,0,0); // rotate(-135deg);

    position: relative;
    top: -2px;
}

@define-mixin _rotate $deg {
	transform:rotate($deg);
	-ms-transform:rotate($deg);
	-moz-transform:rotate($deg);
	-webkit-transform:rotate($deg);
	-o-transform:rotate($deg);
}

@define-mixin _translate $x,$y {
	transform: translate($x, $y);
	-ms-transform: translate($x, $y);
	-moz-transform: translate($x, $y);
	-webkit-transform: translate($x, $y);
	-o-transform: translate($x, $y);
}

@define-mixin _translateX $x {
	transform: translateX($x);
	-ms-transform: translateX($x);
	-moz-transform: translateX($x);
	-webkit-transform: translateX($x);
	-o-transform: translateX($x);
}

@define-mixin _translateY $y {
	transform: translateY($y);
	-ms-transform: translateY($y);
	-moz-transform: translateY($y);
	-webkit-transform: translateY($y);
	-o-transform: translateY($y);
}
*/

/*
Chevron
https://github.com/scriptex/itcss/blob/0dab9583f2a75eb1cce8bb6ec2d45f5f36f28182/assets/tools/_chevron.css#L3

@define-mixin chevron $dimensions: 1rem, $border-width: 0 0 1px 1px, $border-color: currentColor, $margin: auto, $rotation: 45deg {
	content: '';
	width: $dimensions;
	height: $dimensions;
	display: inline-block;
	vertical-align: middle;
	border-width: $border-width;
	border-style: solid;
	border-color: $border-color;
	margin: $margin;
	transform: rotate($rotation);
	transform-origin: 50% 50%;
	transition: all var(--timing) var(--easing);
}
*/


/*
Color varients
https://github.com/cristianoliveira/react-lib-boilerplate/blob/de85472926480ff6bc8356f8efa38702dba99076/src/theme/_mixins.css#L3
@define-mixin base-color $style {
  $(style): color(var(--black) tint(35%));
}

@define-mixin dark-color $style {
  $(style): color(var(--black) tint(11%));
}

@define-mixin light-color $style {
  $(style): color(var(--black) tint(60%));
}
*/

/*
12 column grid via flex

https://github.com/DEEP-IMPACT-AG/cherry-grid/blob/7588d6c131a64ddcfde859b6aca356d608a65ce6/src/Content/Col/Col.css#L3-L90
*/


/*
// Breakpoints
// https://github.com/Kataphratto/addaphratto/blob/f6d89edab03d8fb774db4230c511547ef73679bb/wp-content/themes/repowp/modules/css/base/mixins.css#L5
@define-mixin breakpoint $value{

    @if $value == mobile {
      // da 480px
      @media all and (min-width: 30em) { @mixin-content; }
    }

    @if $value == mobile_only{
      /* da 768px
      @media all and (max-width: 767px) { @mixin-content; }
    }

    @if $value == tablet_portrait{
      // da 768px
      @media all and (min-width: 48em) { @mixin-content; }
    }

    @if $value == tablet_landscape{
      // da 1024px
      @media all and (min-width: 64em) { @mixin-content; }
    }

    @if $value == desktop{
      // da 1230px
      @media all and (min-width: 76.875em) { @mixin-content; }
    }
}
@mixin breakpoint desktop{
		margin-top: 85px;
	}
*/

/*
// https://github.com/Kataphratto/addaphratto/blob/f6d89edab03d8fb774db4230c511547ef73679bb/wp-content/themes/repowp/modules/css/base/mixins.css#L39
@define-mixin Thin{
    font-family: 'Libre Franklin', sans-serif;
    font-weight: 100;
}
@define-mixin ExtraLightItalic{
    font-family: 'Libre Franklin', sans-serif;
    font-weight: 200;
    font-style: italic;
}
@define-mixin Light{
    font-family: 'Libre Franklin', sans-serif;
    font-weight: 300;
}
@define-mixin Regular{
    font-family: 'Libre Franklin', sans-serif;
    font-weight: 400;
}
@define-mixin SemiBold{
    font-family: 'Libre Franklin', sans-serif;
    font-weight: 600;
}
@define-mixin Bold{
    font-family: 'Libre Franklin', sans-serif;
    font-weight: 700;
}
// usage
@define-mixin Title{
    @mixin Thin;
    font-size: 32px;
    line-height: 32px;
    color: $menu-color;

    @mixin breakpoint tablet_portrait{
        font-size: 44px;
        line-height: 44px;
    }
}



/* Hidden Text

// "Display none effect", without using display:none. Perfect for SEO.

@define-mixin hiddenText{
    display:block !important;
    border:0 !important;
    margin:0 !important;
    padding:0 !important;
    font-size:0 !important;
    line-height:0 !important;
    width:0 !important;
    height:0 !important;
    overflow:hidden !important;
}
*/


/*********************
MIN SIZING
@define-mixin min-size $height, $width {
  height: $height;
  min-height: $height;
  width: $width;
  min-width: $width;
}

MAX HEIGHT
@define-mixin max-height $height {
  height: $height;
  max-height: $height;
}
*********************/


/*
// https://github.com/ivolimasilva/ivolimasilva.github.io/blob/a3a87e7af7615637920e01049b1ecf1bfbdb39c8/src/shared/styles/mixins/themes.css#L1
@define-mixin theme-light $selector: null {
    @media (prefers-color-scheme: light) {
        body:not([data-theme]) {
            @mixin-content;
        }
    }

    @media (prefers-color-scheme: dark) {
        body[data-theme] {
            @mixin-content;
        }
    }
}

@define-mixin theme-dark $selector: null {
    @media (prefers-color-scheme: dark) {
        body:not([data-theme]) {
            @mixin-content;
        }
    }

    @media (prefers-color-scheme: light) {
        body[data-theme] {
            @mixin-content;
        }
    }
}

// usage:
@mixin theme-light {
  background-color: var(--background-color-light);
}
// in type https://github.com/ivolimasilva/ivolimasilva.github.io/blob/a3a87e7af7615637920e01049b1ecf1bfbdb39c8/src/shared/styles/global/typography.css#L20
@mixin theme-light {
    color: var(--color-black);
}
@mixin theme-dark {
    color: var(--color-white);
}
*/


/*
https://github.com/engageinteractive/core/blob/master/src/scss/utility/_mixins.scss#L389
	Responsive ratio
	Used for creating scalable elements that maintain the same ratio
	example:
	.element {
		@include responsive-ratio(400, 300);
	}

@mixin responsive-ratio($x,$y, $pseudo: false) {
	$padding: unquote( ( $y / $x ) * 100 + '%' );

	@if $pseudo {
		&::before {
			@include pseudo($pos: relative);
			width: 100%;
			padding-top: $padding;
		}
	} @else {
		padding-top: $padding;
	}
}

*/


/*
REM calc
// example: @include rem("margin", 10, 5, 10, 5);
// example: @include rem("font-size", 14);
https://github.com/ryanburgess/SASS-Useful-Mixins/blob/master/mixins/_rem.scss#L16

@mixin rem($property, $values...) {
  $n: length($values);
  $i: 1;

  $pxlist: ();
  $remlist: ();

  @while $i <= $n {
    $itemVal: (nth($values, $i));
    @if $itemVal != "auto"{
      $pxlist: append($pxlist, $itemVal + px);
      //$remlist: append($remlist, ($itemVal / 10) + rem); // Use this if you've set HTML font size value to 62.5%
      $remlist: append($remlist, ($itemVal / 16) + rem);
    } @else {
      $pxlist: append($pxlist, auto);
      $remlist: append($remlist, auto);
    }

    $i: $i + 1;
  }

  #{$property}: $pxlist;
  #{$property}: $remlist;
}

>>>>>>>>>>>>>>>also

function fontSize(mixin, px) {
    const pxNumb = px * 1 // convert String to Number
    return {
        'font-size': (pxNumb / 16) + 'rem',
        [`@media (min-width: ${breakpoints.md})`]: {
            'font-size': ((pxNumb + 2) / 16) + 'rem',
        },
    };
}

>>>>>>>>>>>>>>>also

@mixin font-size($font-size, $line-height: normal, $letter-spacing: normal) {
  font-size: $font-size * 1px;
  // font-size: $font-size * 0.1rem;
  // example using rem values and 62.5% font-size so 1rem = 10px

  @if $line-height==normal {
    line-height: normal;
  } @else {
    line-height: $line-height / $font-size;
  }

  @if $letter-spacing==normal {
    letter-spacing: normal;
  } @else {
    letter-spacing: #{$letter-spacing / $font-size}em;
  }
}

//
p {
  @include font-size(12, 18, 1.2);
  // returns
  font-size: 12px;
  line-height: 1.5; // 18 / 12
  letter-spacing: 0.1em;
}

Also

https://github.com/mobify/spline/blob/develop/dist/functions/rem/_rem.scss#L14

*/


/*
// https://dev.to/alemesa/10-awesome-sass-scss-mixins-5ci2
@mixin fade($type) {
  @if $type== "hide" {
    visibility: hidden;
    opacity: 0;
    transition: visibility 1s, opacity 1s;
  } @else if $type== "show" {
    visibility: visible;
    opacity: 1;
    transition: visibility 1s, opacity 1s;
  }
}
*/

/*
Background transition
https://codepen.io/alemesa/pen/XWbXLNK
@mixin background-transition($initial, $hover, $inversed: false) {
  background: linear-gradient(
    90deg,
    $hover 0%,
    $hover 50%,
    $initial 50%,
    $initial 100%
  );
  background-repeat: no-repeat;
  background-size: 200% 100%;

  background-position: right bottom;
  @if $inversed {
    background-position: left bottom;
  }
  transition: background-position 0.25s ease-out;

  &:hover {
    background-position: left bottom;
    @if $inversed {
      background-position: right bottom;
    }
  }
}
// usage
&:nth-of-type(1) {
  @include background-transition(#4CAF50, #3F51B5);
}

&:nth-of-type(2) {
  color: #424242;
  @include background-transition(#FFEE58, #e57373, true);
}

&:nth-of-type(3) {
  @include background-transition(#311B92, #1976D2);
}
*/


/*
/ Generates a grow-then-shrink (or shrink-then-grow) animation using transform(scale).

/ @example scss - Usage
/   .foo {
/     @include scale(0.5, 3s ease infinite alternate);
/   }
/ @example css - Result
/   .foo {
/     -webkit-animation: "scale-0-5" 3s ease infinite alternate;
/     animation: "scale-0-5" 3s ease infinite alternate;
/   }
/  // -webkit- prefixed @keyframes are also generated
/  @keyframes scale-0-5 {
/    from, to {
/      -webkit-transform: scale(1);
/      -ms-transform: scale(1);
/      transform: scale(1);
/    }
/    50% {
/      -webkit-transform: scale(0.5);
/      -ms-transform: scale(0.5);
/      transform: scale(0.5);
/    }
/  }
@mixin scale($scale-change:1.1, $animation-properties: 1s ease-in-out) {
  $alias: 'scale-' + str-replace($scale-change + '', '.', '-');

  @include keyframes($alias){
    0%, 100% {
      @include transform(scale(1));
    }
    50% {
      @include transform(scale($scale-change));
    }
  }

  @include prefix(animation, $alias $animation-properties, 'webkit');
}


Slide in from

https://github.com/gillesbertaux/andy/blob/master/andy.scss#L659-L709

*/


/*
absolute positioning
// https://cssowl.owl-stars.com/documentation.html#cssowl-absolute
.example-absolute-inside
  > .top-center
    +cssowl-absolute-inside(10px, 10px, top, center)
  > .middle-right
    +cssowl-absolute-inside(10px, 10px, middle, right)
  > .bottom-center
    +cssowl-absolute-inside(10px, 10px, bottom, center)
  > .middle-left
    +cssowl-absolute-inside(10px, 10px, middle, left)
https://github.com/owl-stars/cssowl/blob/master/src/cssowl/absolute/absolute.yml
 */


/*
Color swap
https://github.com/davidtheclark/scut/blob/v1.4.0/src/general/_color-swap.scss
*/

/*
Circle
https://github.com/davidtheclark/scut/blob/v1.4.0/src/general/_circle.scss

Triangle
https://davidtheclark.github.io/scut/triangle.html

Sidelined text
https://davidtheclark.github.io/scut/side-lined.html
*/


/*
Dashed line - https://oulu.github.io/articles/mixins/mixins-line.html

.wrapper:after {
  width: 100%;
  display: block;
  background-image: url('data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4gPHN2ZyB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJncmFkIiBncmFkaWVudFVuaXRzPSJvYmplY3RCb3VuZGluZ0JveCIgeDE9IjAuMCIgeTE9IjAuNSIgeDI9IjEuMCIgeTI9IjAuNSI+PHN0b3Agb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iIzAwMDAwMCIvPjxzdG9wIG9mZnNldD0iNjYuNjY2NjclIiBzdG9wLWNvbG9yPSIjMDAwMDAwIi8+PHN0b3Agb2Zmc2V0PSI2Ni42NjY2NyUiIHN0b3AtY29sb3I9IiMwMDAwMDAiIHN0b3Atb3BhY2l0eT0iMC4wIi8+PHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjMDAwMDAwIiBzdG9wLW9wYWNpdHk9IjAuMCIvPjwvbGluZWFyR3JhZGllbnQ+PC9kZWZzPjxyZWN0IHg9IjAiIHk9IjAiIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JhZCkiIC8+PC9zdmc+IA==');
  background-size: 100%;
  background-image: linear-gradient(to right, #000000, #000000 66.66667%, rgba(0, 0, 0, 0) 66.66667%, rgba(0, 0, 0, 0) 100%);
  background-size: 30px 30px;
  height: 4px;
  height: 0.4rem;
}

*/


/*
Animations
https://github.com/colindresj/saffron/blob/master/saffron/entrances/_stretch.scss
*/
