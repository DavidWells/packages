import React from 'react'
import InputBase from '@davidwells/components-input'
import useEventListener from '@use-it/event-listener'
import PropTypes from 'prop-types'
import classNames from 'clsx'
import Icon from '@davidwells/components-icon'
import styles from './input.module.css'

const propTypes = {
  // spread base props
  ...InputBase.propTypes,
  /** visual styles */
  kind: PropTypes.oneOf(['default']),
}

const defaultProps = {
  kind: 'default',
}

const ClearButton = ({ value, actions }) => {


  function handleEscKey(e) {
    var key = e.keyCode || e.charCode || 0;
    const commandHeld = e.metaKey
    /* If Command + A pressed */
    if (commandHeld && key === 65) {
      // e.preventDefault()
    }
    /* If escape key pressed, de-select all logs */
    if (commandHeld && e.which === 191) {
      console.log('/ pressed focus search')
      e.preventDefault()
      actions && actions.focus()
    }
    /* If escape key pressed, de-select all logs */
    if (e.which === 27) {
      // e.preventDefault()
      if (value) {
        console.log('Esc pressed and input has value. Clear it')
        actions && actions.clear()
      } else {
        console.log('Esc pressed and input has no value. blur it')
        actions && actions.blur()
      }
    }
  }

  /* Attach esc key listener */
  useEventListener('keydown', handleEscKey)

  let showClear
  if (value) {
    showClear = (
      <>x<Icon onClick={actions.clear} className={`${styles.clearSearch} clear-search`} name={'github'} size={16} /></>
    )
  }
  return (
    <>
      {showClear}
    </>
  )
}

const Input = ({
  className,
  kind,
  icon,
  iconSize,
  after,
  before,
  inputRef,
  ...props
}) => {

  const elementRef = inputRef || React.createRef()
  const [ val, setValue ] = React.useState('')


  const wrapperClasses = classNames(
    styles.wrapper,
    styles[kind],
    styles[`${kind}Wrapper`]
  )

  const inputClasses = classNames(
    className,
    styles.input,
    styles[kind],
    {
      [styles.hasIcon]: icon
    }
  )

  const handleFocus = () => {
    if (inputRef && inputRef.current) {
      inputRef.current.focus()
    }
  }

  const handleClear = () => {
    if (inputRef && inputRef.current) {
      inputRef.current.value = ''
    }
  }

  let iconRender
  if (icon) {
    iconRender = (
      <Icon onClick={handleFocus} className={styles.icon} name={icon} size={18} />
    )
  }

  let afterRender = iconRender
  if (after) {
    afterRender = (
      <>
        {iconRender}
        {after}
      </>
    )
  }

  return (
    <>
    <InputBase
      {...props}
      inputRef={elementRef}
      before={<b>cool</b>}
      isRequired={false}
      onChange={(_, value, api) => {
        console.log('onChange api', api)
        console.log('setExternalValue', value)
        setValue(value)
        if (value === 'crap') {
          api.actions.setError('crappp')
        }
        if (value === 'boo') {
          api.actions.setError('booo')
        }
      }}
      value={val}
      after={({ value, actions }) => {
        return (
          <>
            <ClearButton actions={actions} value={value} />
            {iconRender}
            {after}
          </>
        )
      }}
      classes={{
        wrapper: wrapperClasses,
        input: inputClasses,
        inputValid: styles.isValid,
        inputInvalid: styles.isInvalid,
        errorMessage: styles.validationMessage
      }}

      // validation={{
      //   pattern: /^([\w_.\-+])+@([\w-]+\.)+([\w]{2,10})+$/,
      //   message: <b>Please enter a valid email address</b>,
      // }}
      validation={customSyncValidation}
      // validation={customAsyncValidation}
      // validation={/^([\w_.\-+])+@([\w-]+\.)+([\w]{2,10})+$/}
    />
    </>
  )
}

function customSyncValidation(value) {
  console.log('value', value)
  if (value === 'foo') {
    return {
      isValid: false,
      // message: 'Error will',
      message: 'Foo is not allowed'
    }
  }

  return {
    isValid: true,
  }
}

async function customAsyncValidation(value) {
   console.log('customSyncValidation called')

  console.log('>>> Do validation on', value)
  await delay(1000)
  if (value === 'foo') {
    return {
      isValid: false,
      // message: 'Error will',
      message: 'Foo is not allowed'
    }
  }
  return {
    isValid: true,
    // message: 'Error will',
    message: Tester
  }
}

function Yes(props) {
  console.log('yes props', props)
  return <div>yes</div>
}

class Tester extends React.Component {
  render() {
    console.log('tester props', this.props)
    return (
      <div>
        Tester
        <div onClick={this.props.actions.clear}>Clear</div>
      </div>
    )
  }
}

function delay(ms) {
  return new Promise(res => setTimeout(res, ms))
}

Input.propTypes = propTypes
Input.defaultProps = defaultProps

export default Input
