import React from 'react'
import '@davidwells/components-flex/dist/index.css'
import { Flex, Column, Row } from '@davidwells/components-flex'

export default function LayoutThree() {
  return (
    <Column isFullScreen debug>
      <Row auto debug>
        <div>- row one</div>
        <div>- row two</div>
        <div>- row three</div>
      </Row>
      <Column isFullWidth align='left stretch' debug>
        <span>col contents 1</span>
        <Row debug>
          <span>row in column 1</span>
          <span>row in column 2</span>
          <span>row in column 3</span>
        </Row>
        <span>col contents 2</span>
        <span>col contents 3</span>
        <Row debug>
          <span>row in column 1</span>
          <span>row in column 2</span>
          <span>row in column 3</span>
        </Row>
      </Column>
    </Column>
  )
}
