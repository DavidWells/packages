import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'clsx'
import addSVGtoDOM from './utils/injectSVGtoDOM'
import styles from './Icon.module.css'

const propTypes = {
  /** Custom CSS Classes */
  className: PropTypes.string,
  /** Custom CSS Classes */
  style: PropTypes.object,
  /** Size of Icon. Takes number or pixel value. Example size={30} */
  size: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number
  ]),
  /** Fill color override from default. Hex value */
  fill: PropTypes.string,
  /** if true the icon will spin */
  isSpinning: PropTypes.bool,
  /** Custom on click function */
  onClick: PropTypes.func,
  /** Optional inline SVG children */
  children: PropTypes.element,
}

const defaultProps = {
  size: '16px'
}

/**
 * See all icons at <a href="#icons">Icons list</a>
 */
const Icon = ({ children, className, size, onClick, ...props }) => {
  const classes = classNames(
    'component-icon',
    styles.wrapper,
    className
  )

  const svgClasses = classNames(
    styles.icon,
    {
      [styles.spinning]: props.isSpinning,
      [styles.hasClick]: onClick
    }
  )

  const customSize = {
    height: size,
    width: size
  }

  const fillStyles = (props.fill) ? {fill: props.fill} : {}

  const platformPrefix = ''

  let iconContents = (
    <use xlinkHref={`#${platformPrefix}${props.name}`} />
  )
  /* If inline SVG used render */
  if (children && (children.type === 'g' || children.type === 'svg')) {
    iconContents = children
  }

  const inlinedStyles = {
    ...customSize,
    ...fillStyles
  }

  return (
    <span className={classes} style={props.style} onClick={onClick}>
      <svg style={inlinedStyles} className={svgClasses}>
        {iconContents}
      </svg>
    </span>
  )
}

Icon.propTypes = propTypes
Icon.defaultProps = defaultProps

export { addSVGtoDOM }

export default Icon
