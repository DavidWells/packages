import React, { Component } from 'react'
import PropTypes from 'prop-types'
import classNames from 'clsx'
import { smartRender, isElement } from '@davidwells/react-utils'

const noOp = () => {}

const propTypes = {
  /* Custom CSS classes */
  classes: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.object
  ]),
  /** Set type of HTML5 input */
  type: PropTypes.string,
  /** Set current value */
  value: PropTypes.string,
  /** Set initialValue for uncontrolled components */
  initialValue: PropTypes.string,
  /** Placeholder text */
  placeholder: PropTypes.string,
  /** disable input field if true */
  isDisabled: PropTypes.bool,
  /** make field required */
  isRequired: PropTypes.bool,
  /** Make textarea instead of input */
  isTextArea: PropTypes.bool,
  /** Run function onBlur */
  onBlur: PropTypes.func,
  /** Run function onChange */
  onChange: PropTypes.func,
  /** Run function onFocus */
  onFocus: PropTypes.func,
  /** Run function onKeyPress */
  onKeyPress: PropTypes.func,
  /** Run function on validation failure */
  onInvalidValue: PropTypes.func,
  /** Field validation. Can be regex, function, or keyName from validation utils */
  validation: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.object,
    PropTypes.instanceOf(RegExp)
  ]),
  /** Custom Error text */
  errorMessage: PropTypes.string,
  /** debounce validation timeout */
  debounce: PropTypes.number,
  /** (dont use unless necessry) Set to use outside state and disable debounce */
  isControlled: PropTypes.bool,
  /** debounce validation timeout */
  disableGlobalClasses: PropTypes.bool,
}

const defaultProps = {
  type: 'text',
  isDisabled: false,
  isRequired: false,
  debounce: 1000,
  classPrefix: '',
  errorMessage: 'Invalid Value',
  classes: {},
  disableGlobalClasses: false
}

class Input extends Component {
  constructor(props, context) {
    super(props, context)
    const { value, isTextArea, classes, classPrefix, disableGlobalClasses, onChange, isControlled } = props
    this.state = {
      // isValid: this.validateInputValue(value).isValid, async cant be in constructor
      blurRanOnce: (value) ? true : false,
      // Timeout ID
      tid: void 0,
    }
    // Set component name
    const tag = isTextArea ? 'textarea' : 'input'
    const prefix = postFixer(classPrefix)
    this.componentBaseName = `${prefix}component-${tag}`

    this.isControlled = Boolean(isControlled || typeof value === 'string' && onChange)

    // Set invalid classes
    this.invalidClasses = classNames({
      [classes.inputInvalid]: classes.inputInvalid,
      [`${this.componentBaseName}-invalid`]: !disableGlobalClasses
    }).split(' ')

    // Set valid classes
    this.validClasses = classNames({
      [classes.inputValid]: classes.inputValid,
      [`${this.componentBaseName}-valid`]: !disableGlobalClasses
    }).split(' ')

    this.actions = {
      blur: this.blur,
      focus: this.focus,
      clear: this.clear,
      setError: this.setError,
      setValid: this.setValid
    }
  }
  componentDidMount() {
    let inputRef = this.getRef()
    if (inputRef && this.props.initialValue) {
      inputRef.value = this.props.initialValue
    }
    setTimeout(async () => {
      // sometimes value is set via the DOM. This updates initial state
      inputRef = this.getRef()
      if (inputRef && inputRef.value) {
        const inputData = await this.validateInputValue(inputRef.value)
        this.setState({
          tid: void 0,
          isValid: inputData.isValid,
          errorMessage: inputData.errorMessage,
          value: inputRef.value
        }, this.setVisibleValidation(inputData))
      }
    }, 0)
  }
  shouldComponentUpdate(nextProps, nextState) {
    const keys = Object.keys(nextProps)
    const { value, isValid } = this.state
    // if value invalid, always update
    if (!isValid) {
      return true
    }
    // We only consider the search term from the state
    if (value !== nextState.value) {
      return true
    }
    // We render if anything in the properties changed
    // > Different number of properties
    if (keys.length !== Object.keys(this.props).length) {
      return true
    }
    // > Different properties
    const changed = keys.some(key => nextProps[key] !== this.props[key])
    if (changed) {
      return true
    }
    return false
  }
  componentWillUnmount() {
    const { tid } = this.state
    window.clearTimeout(tid)
  }
  async validateInputValue(value) {
    const { validation, errorMessage, isRequired, name } = this.props
    const inputRef = this.getRef()
    // If actions.setError called, persist its error on blur
    if (this.state.externalError && !isRequired && value !== '') {
      return {
        name,
        inputRef,
        value: value,
        isValid: false,
        errorMessage: this.state.errorMessage
      }
    }

    /* If field is NOT required and is empty again */
    if (!isRequired && value === '') {
      return {
        name,
        inputRef,
        value: value,
        isEmpty: true,
        isValid: true
      }
    }

    if (isRequired && value === '') {
      return {
        name,
        inputRef,
        value: value,
        isRequired: true,
        isValid: false,
        errorMessage: 'Required value'
      }
    }

    if (!validation) {
      // return early no validation
    }

    /* If field has already been validated return early */
    if (this.state.isValid && (this.state.value === value)) {
      // console.log('Already validated', value)
      // return {
      //   value: value,
      //   isValid: true,
      //   errorMessage: ''
      // }
    }

    if (typeof validation === 'object' && validation.pattern) {
      // if validation object is used
      return {
        name,
        inputRef,
        value: value,
        isValid: validation.pattern.test(value),
        errorMessage: validation.message || errorMessage
      }
    }

    // check regex passed in
    if (validation instanceof RegExp) {
      return {
        name,
        inputRef,
        value: value,
        isValid: validation.test(value),
        errorMessage: errorMessage
      }
    }

    // do custom function for validation
    if (typeof validation === 'function') {
      const validationReturn = await validation(value)
      return {
        name,
        inputRef,
        value: value,
        isValid: validationReturn.isValid,
        errorMessage: validationReturn.message
      }
    }

    // default field is valid if no validation
    return {
      name,
      inputRef,
      value: value,
      isValid: true,
      errorMessage: ''
    }
  }
  handleChange = (event) => {
    /*
    if (this.isControlled) {
      console.log('NO DELAY')
      // because debounce, fake event is passed back
      this.props.onChange({ target: this.getRef() }, event.target.value, {
        isValid: 'x',
        actions: this.actions,
      })
      return
    }
    */

    const { tid } = this.state
    const { debounce, validation } = this.props
    // If has validation, apply debouncer
    let deboundTimeout = (validation) ? debounce : 0
    // If form values controlled by outside state ignore debounce
    if (this.isControlled) {
      deboundTimeout = 0
    }
    if (tid) {
      clearTimeout(tid)
    }
    this.setState({
      value: event.target.value,
      tid: setTimeout(this.emitDelayedChange, deboundTimeout),
    })
  }
  setError = (message = '', external = true) => {
    this.setState({
      tid: void 0,
      isValid: false,
      errorMessage: message,
      externalError: external
    })

    this.setInvalidClasses()
    // set fake blur so validation will show
    this.setFakeBlur()
  }
  setValid = () => {
    this.setState({
      tid: void 0,
      isValid: true,
      errorMessage: ''
    })
    this.setValidClasses()
  }
  getRef() {
    const { inputRef } = this.props
    if (inputRef && inputRef.current) {
      return inputRef.current
    }
    return this.textInput
  }
  setValidClasses() {
    const inputRef = this.getRef()
    inputRef.classList.remove(...this.invalidClasses)
    inputRef.classList.add(...this.validClasses)
  }
  setInvalidClasses() {
    const inputRef = this.getRef()
    inputRef.classList.remove(...this.validClasses)
    inputRef.classList.add(...this.invalidClasses)
  }
  resetClasses() {
    const inputRef = this.getRef()
    inputRef.classList.remove(...this.invalidClasses)
    inputRef.classList.remove(...this.validClasses)
  }
  setVisibleValidation(inputData) {
    const inputRef = this.getRef()
    // console.log('inputData', inputData)
    // console.log('inputRef.value', inputRef.value)
    // console.log('inputData.message', inputData.errorMessage)

    if (!this.props.validation) {
      return
    }

    if (inputData.isRequired) {
      this.setInvalidClasses()
    }

    // Input value is not valid!
    if (!inputData.isValid && inputRef.value) {
      this.setError(inputData.errorMessage, false)
    }
    // Input value is valid!
    if (inputData.isValid && inputRef.value) {
      this.setValidClasses()
    }

    // If input is empty and the validation is bad, remove the valid class
    if (!inputData.value && !inputData.isValid) {
      inputRef.classList.remove(...this.validClasses)
      // this.setInvalidClasses()
    }

    if (!inputData.isValid && this.props.onInvalidValue) {
      this.props.onInvalidValue(inputData, inputRef)
    }
  }
  setFakeBlur = () => {
    this.setState({ blurRanOnce: true })
  }
  handleFocus = (event) => {
    const { onFocus, readOnly } = this.props
    const { isValid } = this.state

    if (readOnly) {
      this.select()
    }

    // this.outlineInput()
    if (onFocus) {
      onFocus(event, event.target.value, isValid)
    }
  }
  handleClick = (event) => {
    const { onClick } = this.props
    if (onClick) onClick(event)

    if (this.getRef().value) {
      // make onClick 'trigger' a blur
      this.setFakeBlur()
    }
  }
  emitDelayedChange = async () => {
    const value = this.state.value
    const inputData = await this.validateInputValue(value)
    // console.log('emitDelayedChange inputData', inputData)

    /* If field is NOT required and is empty again */
    if (inputData.isEmpty) {
      // Reset validation classes
      this._resetInput()
    } else if (inputData.isRequired) {
      // Set is required valid state
      this.setState({
        tid: void 0,
        isValid: inputData.isValid,
        errorMessage: inputData.errorMessage
      }, this.setVisibleValidation(inputData))
    } else if (!inputData.isValid) {
      // Set valid state
      this.setState({
        tid: void 0,
        isValid: inputData.isValid,
        errorMessage: inputData.errorMessage
      }, this.setVisibleValidation(inputData))
    } else if (inputData.isValid) {
      // Set error invalid state
      this.setState({
        tid: void 0,
        isValid: inputData.isValid,
        errorMessage: inputData.errorMessage
      }, this.setVisibleValidation(inputData))
    }

    if (this.props.onChange) {
      // because debounce, fake event is passed back
      const data = {
        value: value,
        isValid: inputData.isValid,
        actions: this.actions,
      }
      const fakeEvent = {
        target: this.getRef(),
        preventDefault: noOp
      }
      this.props.onChange(fakeEvent, data)
    }
  }
  handleBlur = async (event) => {
    // const { isValid } = this.state
    let inputData = {}
    if (event.target.value) {
      inputData = await this.validateInputValue(event.target.value)
      // inputData.isValid
      this.setState({
        tid: void 0,
        isValid: inputData.isValid,
        errorMessage: inputData.errorMessage
      }, () => {
        this.setVisibleValidation(inputData)
      })
    }

    if (!event.target.value) {
      this.getRef().classList.remove(...this.validClasses)
    }

    // Set blur state to show validations
    if (!this.state.blurRanOnce && event.target.value) {
      // capture focus if input wrong
      this.setState({
        blurRanOnce: true
      // })
      }, this.captureFocusWhenInvalid())
    }

    if (this.props.onBlur) {
      this.props.onBlur(event, event.target.value, {
        isValid: inputData.isValid,
        actions: this.actions,
      })
    }
  }

  captureFocusWhenInvalid() {
    if (!this.state.isValid && this.props.isRequired) {
      // not sure about this guy. Results in different form tabbing behavior
      // this.focus()
    }
  }
  select = () => {
    this.getRef().select()
  }
  blur = () => {
    this.getRef().blur()
  }
  focus = () => {
    this.getRef().focus()
  }
  clear = () => {
    const { onChange } = this.props
    const inputRef = this.getRef()
    this._resetInput(() => {
      if (inputRef) inputRef.value = ''
      if (onChange) {
        // Fire on change event on clear
        onChange({ target: inputRef }, '')
      }
    })
  }
  _resetInput = (callback) => {
    this.setState({
      blurRanOnce: false,
      errorMessage: null,
      value: ''
    }, () => {
      this.resetClasses()
      if (callback) callback()
    })
  }

  renderValidation() {
    const { isValid, errorMessage, blurRanOnce } = this.state
    const { disableGlobalClasses, classes } = this.props
    if (isValid) {
      return null
    }
    // Dont show validation, if no blur
    if (!blurRanOnce) {
      return null
    }
    // Error message might not be resolved yet
    if (!errorMessage) {
      return null
    }

    const errorClasses = classNames({
      [classes.errorMessage]: true,
      [`${this.componentBaseName}-error`]: !disableGlobalClasses
    })

    // Default render
    if (typeof errorMessage === 'string' || isElement(errorMessage)) {
      return (
        <div className={errorClasses} onClick={this.focus}>
          {errorMessage}
        </div>
      )
    }

    // If functional or class component
    return smartRender(errorMessage, {
      value: this.state.value,
      isValid: this.state.isValid,
      actions: this.actions,
      classes: errorClasses
    })
  }
  render() {
    const {
      classes,
      className,
      isDisabled,
      isRequired,
      isTextArea,
      type,
      value,
      inputRef,
      before,
      after,
      disableGlobalClasses,
      // pluck out unknown keys before input render
      actions,
      validation,
      errorMessage,
      debounce,
      classPrefix,
      initialValue,
      onInvalidValue,
      ...others
    } = this.props

    const CLASSES = (!className) ? classes : { ...classes, ...{ input: className } }
    const componentBaseName = this.componentBaseName

    const inputClasses = classNames({
      [CLASSES.input]: CLASSES.input,
      [componentBaseName]: !disableGlobalClasses
    })

    const defaultRef = (input) => this.textInput = input // eslint-disable-line no-return-assign
    const reffer = inputRef || defaultRef

    const inputProps = {
      ...others,
      onChange: this.handleChange,
      onBlur: this.handleBlur,
      onFocus: this.handleFocus,
      onClick: this.handleClick,
      ref: reffer,
      role: 'input',
      name: others.name || others.id || others.ref || formatName(others.placeholder),
      disabled: isDisabled,
      required: isRequired,
      type,
      value,
      className: inputClasses,
    }

    const wrapperClasses = classNames(
      CLASSES.wrapper,
      (disableGlobalClasses) ? {} : {
        [`${componentBaseName}-wrapper`]: true,
        [`${componentBaseName}-has-before`]: before,
        [`${componentBaseName}-has-after`]: after,
      }
    )

    const propsToPass = {
      value: this.state.value,
      isValid: this.state.isValid,
      actions: this.actions
    }

    const afterContent = smartRender(after, propsToPass)
    const inputElement = (isTextArea) ? <textarea {...inputProps} /> : <input {...inputProps} />
    const beforeContent = smartRender(before, propsToPass)

    return (
      <div className={wrapperClasses}>
        {beforeContent}
        {inputElement}
        {afterContent}
        {this.renderValidation()}
      </div>
    )
  }
}

function postFixer(string, suffix = '-') {
  if (!string) return ''
  if (string.indexOf(suffix, string.length - suffix.length) !== -1) {
    return string
  }
  return `${string}-`
}

function formatName(name) {
  return name.replace(/\s|-/g, '_')
}

Input.propTypes = propTypes
Input.defaultProps = defaultProps

export default Input
