/* eslint quote-props: 0 */

import React from 'react'
import classNames from 'clsx'
import PropTypes from 'prop-types'
import css from './Flex.module.css'

const defaultValue = 'default'

const Flex = ({
  style = {},
  width,
  height,
  align,
  grow,
  auto,
  isColumn,
  isFullScreen,
  isFullWidth,
  // isFullHeight,
  className,
  debug,
  ...props
}) => {
  const isRow = !isColumn
  const isFullHeight = typeof grow === 'boolean'
  const stretchElement = isColumn && typeof grow === 'boolean'
  const [x, y] = getAlignment(align)
  const HEIGHT = height || style.height
  let WIDTH = width || style.width
  let inlineStyles = {} // eslint-disable-line prefer-const

  const [ horizontalClasses, verticalClasses ] = getClass(x, y, isColumn, debug)

  /* add outlines for flexbox debugging */
  let alignDebug
  if (debug) {
    inlineStyles.background = randomColor()
    inlineStyles.outline = `3px solid ${randomColor()}`
    alignDebug = `${x} ${y}`
  }

  if (WIDTH) {
    // Handle Fraction
    if (typeof WIDTH === 'string') {
      WIDTH = (WIDTH.indexOf('/') > -1) ? fractionStringToNumber(WIDTH) : unit(WIDTH)
      // console.log('fixed with', WIDTH)
    }
    // Set width
    inlineStyles.width = WIDTH
    if (isColumn) {
      // set flexBasis to auto to stop automatic grow of flex
      inlineStyles.maxWidth = WIDTH
    } else {
      if (typeof width === 'number') {
        inlineStyles.flexGrow = width
      }
    }
  }

  let heightClass
  if (HEIGHT) {
    // Set height
    inlineStyles.height = HEIGHT
    // set flexBasis to auto to stop automatic grow of flex
    if (isColumn) {
      inlineStyles.minWidth = 0
      heightClass = css.columnHeight
    } else {
      // row do this
      heightClass = css.rowHeight
    }
  }

  // Use flex grow
  if (grow) {
    inlineStyles.flexGrow = grow
  }

  const combinedStyles = {
    ...inlineStyles,
    ...style,
  }

  const stretchProps = ['full', 'fill', 'stretch']
  const shouldGrow = !HEIGHT && stretchProps.includes(y)

  const allClasses = classNames(
    className,
    css.flexDefault,
    {
      [`${css.column}`]: isColumn,
      [`${css.flexAuto}`]: auto,
      // Set 'initial basis'
      [`${css.initialBasis}`]: isColumn && !style.flexBasis,
      [`${css.flexGrow}`]: shouldGrow,
      [`${css.noGrow}`]: !isColumn && !shouldGrow && (isRow && !isFullHeight),
      // [`${css.noGrowColumn}`]: isColumn && HEIGHT,
      [`${css.fullScreen}`]: isFullScreen,
      // Make rows fullWidth by default if no width or auto supplied
      [`${css.fullWidth}`]: ((isRow && !WIDTH && !auto) || stretchElement || isFullWidth),
      // If no align, & is full height make row contents flush to top
      [`${css.fullHeightRowDefault}`]: (isRow && (isFullScreen || isFullHeight) && !align),
      // [`${css.fullHeight}`]: ((isColumn && !HEIGHT && !auto) || isFullHeight)
    },
    heightClass,
    verticalClasses,
    horizontalClasses,
  )

  return (
    <div {...props} data-align={alignDebug} className={allClasses} style={combinedStyles}>
      {props.children}
    </div>
  )
}

const units = ['px', '%']

function unit(str) {
  const value = str.toLowerCase()
  const hasUnit = units.find((unit) => {
    return value.indexOf(unit) > -1
  })
  return (hasUnit) ? value : `${value}px`
}

function getClass(x, y, isColumn, debug) {
  const xyz = isColumn ? column : row
  let verticalClasses = xyz.vertical[y]
  let horizontalClasses = xyz.horizontal[x]

  if (!verticalClasses) {
    logMissing(debug, y, Object.keys(column.vertical))
    verticalClasses = xyz.vertical[defaultValue]
  }
  if (!horizontalClasses) {
    logMissing(debug, x, Object.keys(column.horizontal))
    horizontalClasses = xyz.horizontal[defaultValue]
  }
  // console.log('verticalClasses', verticalClasses)
  // console.log('horizontalClasses', horizontalClasses)
  return [ horizontalClasses, verticalClasses ]
}

function randomColor() {
  return '#' + Math.floor(Math.random() * 16777215).toString(16)
}

function logMissing(debug, value, options) {
  if (!debug) return
  console.log(`unknown align value "${value}" passed into Flex. Must be one of ${options}`)
}

Flex.displayName = 'Flex'

Flex.defaultProps = {
  isColumn: false,
  debug: false,
}

Flex.propTypes = {
  /** propName description */
  children: PropTypes.any,
  /** classes applied to Flex */
  className: PropTypes.string,
  /** style applied to Flex */
  style: PropTypes.object,
  /**
   *  Alignment configuration:
   *  Can be a string like 'left top'
   *  an array like ['left', 'top']
   *  or object like { horizontal: 'left', vertical: 'top'}
   */
  align: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.array,
    PropTypes.object
  ]),
  /** Make flex item 100vh viewport height */
  isFullScreen: PropTypes.bool,
  /** Make flex direction column */
  isColumn: PropTypes.bool,
  /** Automatically collapse contents so they only take up their childrens size */
  auto: PropTypes.bool,

  grow: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.string,
    PropTypes.number
  ]),

  height: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number
  ]),

  width: PropTypes.oneOfType([
    PropTypes.number,
    PropTypes.string
  ]),
  /** If true, flexbox debug mode will activate */
  debug: PropTypes.bool,
}

function fractionStringToNumber(s) {
  const num = s.split('/').map(s => Number(s)).reduce((a, b) => a / b)
  return `${Math.round((num * 100)).toString()}%`
}

const row = {
  type: 'row',
  vertical: {
    // TOP
    'top': css.rowTop,
    'flex-start': css.rowTop,
    // Bottom
    'bottom': css.rowBottom,
    'flex-end': css.rowBottom,
    // Middle
    'middle': css.rowMiddle,
    'center': css.rowMiddle,
    // Stretch
    'full': css.rowFill,
    'fill': css.rowFill,
    'stretch': css.rowFill,
    // Around
    'space-around': css.rowAround,
    // Between
    'space-between': css.rowBetween,
    // Default
    'default': css.rowDefault
  },
  horizontal: {
    // Left
    'left': css.rowLeft,
    'flex-start': css.rowLeft,
    // Right
    'right': css.rowRight,
    'flex-end': css.rowRight,
    // Middle
    'middle': css.rowHorizontalMiddle,
    'center': css.rowHorizontalMiddle,
    // Space Around
    'space-around': css.rowHorizontalSpaceAround,
    // Space Between
    'space-between': css.rowHorizontalSpaceBetween,
    // Default
    'default': css.rowHorizontalDefault
  },
}

const column = {
  type: 'column',
  vertical: {
    // TOP
    'top': css.colTop,
    'flex-start': css.colTop,
    // Bottom
    'bottom': css.colBottom,
    'flex-end': css.colBottom,
    // Middle
    'middle': css.colMiddle,
    'center': css.colMiddle,
    // Stretch
    'full': css.colFill,
    'fill': css.colFill,
    'stretch': css.colFill,
    // Around
    'space-around': css.colAround,
    // Between
    'space-between': css.colBetween,
    // Default
    'default': css.colDefault
  },
  horizontal: {
    // Left
    'left': css.colLeft,
    'flex-start': css.colLeft,
    // Right
    'right': css.colRight,
    'flex-end': css.colRight,
    // Middle
    'middle': css.colHorizontalMiddle,
    'center': css.colHorizontalMiddle,
    // Space Around
    'space-around': css.colHorizontalSpaceAround,
    // Space Between
    'space-between': css.colHorizontalSpaceBetween,
    // Default
    'default': css.colHorizontalDefault
  }
}

function getAlignment(align) {
  if (Array.isArray(align) && align[0] && align[1]) {
    return align
  } else if (typeof align === 'object' && align.horizontal && align.vertical) {
    return [align.horizontal, align.vertical]
  } else if (typeof align === 'string') {
    const alignment = align.split(' ')
    return [alignment[0], alignment[1]]
  }
  return [defaultValue, defaultValue]
}

export default Flex
