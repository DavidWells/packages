/****
Global CSS variables for use in CSS and JS

## CSS usage:

  ```css
  backgound: $varName
  ```

## JS usage:

  ```js
  import variables from '../'

  const { blue } = variables
  ```
****/
console.log('x')
const baseValue = 1
const unit = 'rem'
const baseFontSize = (baseValue * 1.6) + unit

module.exports = {
  textSelection: '#80cbbf',
  // -- Colors
  primary: '#4acfa7',
  linkColor: '#00a395',
  secondary: '#888',
  grey: '#444',
  danger: '#fb6d77',
  dangerHover: '#fa3d4a',

  accent1: '#FAFAFA',
  accent2: '#EAEAEA',
  accent3: '#999',
  accent4: '#888',
  accent5: '#666',
  accent6: '#444',
  accent7: '#333',
  accent8: '#292b38',
  accent9: '#1a1c28',
  //-- Navigation settings
  navHeight: '80px',
  // -- Icon sizes
  iconDefault: '24px',
  // Content padding
  contentWidth: '660px',
  contentPaddingLg: '90px',
  contentPaddingMd: '50px',
  contentPaddingSm: '20px',
  // -- Fonts
  fontSize: baseFontSize,
  fontSizeTiny: formatFont(1.2),
  fontSizeSmall: formatFont(1.4),
  fontSizeNormal: baseFontSize,
  fontSizeBig: formatFont(1.8),
  fontSizeH1: formatFont(3.0),
  fontSizeH2: formatFont(2.15),
  fontSizeH3: formatFont(1.7),
  fontSizeH4: formatFont(1.25),
  fontSizeH5: baseFontSize,
  fontSizeH6: formatFont(0.85),
  fontWeightThin: 300,
  fontWeightNormal: 400,
  fontWeightSemiBold: 500,
  fontWeightBold: 700,
  // -- Indexes
  zIndexHighest: 300,
  zIndexHigher: 200,
  zIndexHigh: 100,
  zIndexNormal: 1,
  zIndexLow: -100,
  zIndexLower: -200,
}

function formatFont(modifier) {
  return (modifier * baseValue) + unit
}


// https://github.com/feelfoundation/feel-desktop/blob/08db05ff0e96ee94ba126c1d09ea8ccc22dad8ca/src/app/variables.css
