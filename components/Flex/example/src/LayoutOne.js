import React from 'react'
import { Flex, Column, Row } from './Flex'

const rowStyle = { border: '1px solid #33CC7A', textAlign: 'left' }
const columnStyle = { border: '3px solid #48C1ED' }

export default class LayoutOne extends React.Component {
  render () {
    return (
      <Row style={rowStyle} isFullScreen debug>
        <Column
          style={columnStyle}
          debug>
          <Column
            style={columnStyle}
            grow
            debug>
            <span>Column Component</span>
            <span>Columns gets stacked</span>
            <span>Rows are used for Horizontal</span>
          </Column>
          <Column
            style={columnStyle}
            isFullWidth
            debug>
            <span>Column Component</span>
            <span>Columns gets stacked</span>
            <span>Rows are used for Horizontal</span>
          </Column>
        </Column>

        <Column style={columnStyle} debug>
          <span>Column Component</span>
          <span>This is stacked</span>
          <span>and next to other column</span>
        </Column>
      </Row>
    )
  }
}
