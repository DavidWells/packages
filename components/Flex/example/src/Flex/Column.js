import React from 'react'
import PropTypes from 'prop-types'
import Flex from './Flex'

const propTypes = {
  /** propName description */
  children: PropTypes.any,
  /** classes applied to Column */
  className: PropTypes.string,
  /** classes applied to Column */
  style: PropTypes.object,
  /** Make column into a flex row */
  isRow: PropTypes.bool,
  /** Auto collapse contents */
  auto: PropTypes.bool,
  /** Set inline height */
  height: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number
  ]),
  /** Set inline width */
  width: PropTypes.oneOfType([
    PropTypes.number,
    PropTypes.string
  ]),
}

const defaultProps = {
  isRow: false,
  width: 0,
}

const Column = ({ isRow, ...props }) => {
  return (
    <Flex {...props} isColumn={!isRow}>
      {props.children}
    </Flex>
  )
}

Column.displayName = 'Column'
Column.defaultProps = defaultProps
Column.propTypes = propTypes

export default Column
