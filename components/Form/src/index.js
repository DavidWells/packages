import React from 'react'
import AutoForm from './AutoForm'

function fixScroll() {
  // http://bit.ly/2gQ6jFJ
  this.scrollIntoView(false)
}

function grabNodes(node) {
  return node.querySelectorAll('input,select,textarea')
}

export default class Form extends React.Component {
  componentDidMount() {
    const inputNodes = grabNodes(this.node)
    for (var i = 0; i < inputNodes.length; i++) {
      inputNodes[i].addEventListener('invalid', fixScroll)
    }
  }

  componentWillUnmount() {
    const inputNodes = grabNodes(this.node)
    for (var i = 0; i < inputNodes.length; i++) {
      inputNodes[i].removeEventListener('invalid', fixScroll)
    }
  }

  handleSubmit = (event, data) => {
    const { onSubmit } = this.props
    event.preventDefault()
    if (onSubmit) {
      onSubmit(event, data)
    }
  }

  render() {
    const { id, onChange, className, formClassName, trimOnSubmit, children, name, ...rest } = this.props
    return (
      <div ref={(node) => { this.node = node }} className={className}>
        <AutoForm
          ref={(node) => { this.node = node }}
          name={name}
          id={id}
          trimOnSubmit={trimOnSubmit}
          onChange={onChange}
          onSubmit={this.handleSubmit}
          className={formClassName}
          {...rest}
        >
          {children}
        </AutoForm>
      </div>
    )
  }
}
