import React from 'react'
import '@davidwells/components-flex/dist/index.css'
import { Flex, Column, Row } from './Flex'

const rowStyleTwo = {border: '3px solid #33CC7A', textAlign: 'left'}
const navStyle = {background: '#E8E9EA'}
const navLinkStyle = {padding: 10}
const columnStyleTwo = {border: '3px solid #48C1ED', padding: 10}

export default class LayoutTwo extends React.Component {
  constructor (props, context) {
    super(props, context)
    this.state = {
      sideNavOpen: false
    }
  }
  handleClick = () => {
    console.log('c;ocl')
    this.setState({
      sideNavOpen: !this.state.sideNavOpen
    })
  }
  render () {
    const activeClass = this.state.sideNavOpen ? ' active' : ''
    return (
      <Column isFullScreen>
        <Row align='left' style={navStyle}>
          <span style={navLinkStyle}>Nav item 1</span>
          <span style={navLinkStyle}>Nav item 2</span>
          <span style={navLinkStyle}>Nav item 3</span>
          <Column style={navLinkStyle} align='right'>
            <span onClick={this.handleClick}>Right Nav</span>
          </Column>
        </Row>

        <Row style={rowStyleTwo} grow className='testing'>
          <Column width='1/5' style={columnStyleTwo} className={'left-column' + activeClass}>
            <h6>Left Column</h6>
          </Column>

          <Column align='center top' style={columnStyleTwo} className='middle-column'>
            <h6>Mixddle Column</h6>
          </Column>

          <Column align='left top' width='25%' style={columnStyleTwo} className='right-column'>
            <Row align='left'>
              <h2>Right Column</h2>
            </Row>
            <Row align='left' style={navStyle}>
              <span style={navLinkStyle}>Nav item 1</span>
              <span style={navLinkStyle}>Nav item 2</span>
              <span style={navLinkStyle}>Nav item 3</span>
            </Row>
            <Column align='center center' debug isFullWidth>
              Right Nav
            </Column>
          </Column>
        </Row>
        <Row style={rowStyleTwo} align='center top' className='testing'>
          Footer
        </Row>
      </Column>
   )
  }
}
