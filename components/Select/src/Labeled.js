import React from 'react'
import classnames from 'classnames/bind'
import PropTypes from 'prop-types'
import styles from './Labeled.module.css'

const cx = classnames.bind(styles)

const Label = ({ children, className, hidden, label, required }) => {
  // this is a fix for the label stealing the focus of the checkbox when the checkbox is
  // already focused. without this fix, it looks janky that the checkbox loses the focus
  // ring only to have it again after you release the mouse.
  const handleMouseDown = (event) => {
    event.preventDefault()
  }

  const spanClassName = cx({ Label: true, hidden, required })
  const labelMarkup = (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <span className={spanClassName} onMouseDown={handleMouseDown}>
      {label}
    </span>
  )

  return (
    <label className={className}>
      {labelMarkup}
      {children}
    </label>
  )
}

Label.propTypes = {
  /** The nested input */
  children: PropTypes.node,
  /** Additional className to add to the label */
  className: PropTypes.string,
  /** Visually hide the label */
  hidden: PropTypes.bool,
  /** Label for the input */
  label: PropTypes.node.isRequired,
  /** Displays a required indicator */
  required: PropTypes.bool,
}

/**
 * A component that extracts the common form field pattern of having a Label, the form
 * field itself and finally help/error/success text.
 */
export const Labeled = ({
  children,
  className,
  error,
  helpText,
  hidden,
  label,
  required,
  success,
}) => {
  const helpTextMarkup = helpText && (
    <div variation="subdued">{helpText}</div>
  )
  const successMarkup = success && (
    <div variation="positive">{success}</div>
  )
  const errorMarkup = error && (
    <div variation="warning">{error}</div>
  )
  const hasCaption = errorMarkup || successMarkup || helpTextMarkup
  const captionMarkup = hasCaption && <div>{hasCaption}</div>

  className = cx(className)

  return (
    <Label
      className={className}
      hidden={hidden}
      label={label}
      required={required}
    >
      {children}
      {captionMarkup}
    </Label>
  )
}

Labeled.propTypes = {
  /** The input to wrap */
  children: PropTypes.node,
  /** Any additional classes to add to the button */
  className: PropTypes.string,
  /** Error to display beneath the label */
  error: PropTypes.string,
  /** Additional hint text to display */
  helpText: PropTypes.node,
  /** Visually hide the label */
  hidden: PropTypes.bool,
  /** Label for the input */
  label: PropTypes.string.isRequired,
  /** Mark the field as required */
  required: PropTypes.bool,
  /** Success message to display beneath the label */
  success: PropTypes.string,
}
