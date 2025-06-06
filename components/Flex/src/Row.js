import React from 'react'
import PropTypes from 'prop-types'
import Flex from './Flex'

const propTypes = {
  /** propName description */
  children: PropTypes.any,
  /** classes applied to Row */
  className: PropTypes.string,
  align: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.object
  ]),
  isColumn: PropTypes.bool,
  auto: PropTypes.bool,
  height: PropTypes.oneOfType([
    PropTypes.number,
    PropTypes.string
  ]),
  width: PropTypes.oneOfType([
    PropTypes.number,
    PropTypes.string
  ]),
  style: PropTypes.object,
  isFullScreen: PropTypes.bool,
}

const Row = ({ ...props }) => {
  return (
    <Flex {...props}>
      {props.children}
    </Flex>
  )
}

Row.displayName = 'Row'
Row.propTypes = propTypes

export default Row
