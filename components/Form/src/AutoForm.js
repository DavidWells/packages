import React from 'react'
import { getFormData } from '@analytics/form-utils'

export default class AutoForm extends React.Component {
  static defaultProps = {
    component: 'form',
    trim: false,
    trimOnSubmit: false,
  }

  _onChange = (e) => {
    const { form, name } = e.target
    const data = getFormData.getFieldData(form, name, { trim: this.props.trim })
    const change = {}
    change[name] = data
    this.props.onChange(e, name, data, change, form)
  }

  _onSubmit = (e) => {
    const data = getFormData(e.target, {
      trim: this.props.trimOnSubmit || this.props.trim
    })
    this.props.onSubmit(e, data)
  }

  render() {
    const {
      children,
      component: Component,
      onChange,
      onSubmit,
      trim,
      trimOnSubmit, // eslint-disable-line no-unused-vars
      ...props
    } = this.props
    return (
      <Component
        {...props}
        children={children}
        onChange={onChange && this._onChange}
        onSubmit={onSubmit && this._onSubmit}
      />
    )
  }
}

/* For functional refactor
export default function AutoForm({
  component = 'form',
  trim = false,
  trimOnSubmit = false,
  ...props
}) {
  const {
    children,
    component: Component,
    onChange,
    onSubmit,
  } = props

  return (
    <Component
      {...props}
      children={children}
      onChange={onChange && this._onChange}
      onSubmit={onSubmit && this._onSubmit}
    />
  )
}
*/
