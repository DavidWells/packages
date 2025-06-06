import React from 'react'
/**
 * Smart render utils
 */
export function isClassComponent(component) {
  return typeof component === 'function' && component.prototype && !!component.prototype.isReactComponent
}

export function isFunctionComponent(component) {
  const str = String(component)
  return typeof component === 'function' && str && str.includes('children:')
}

export function isReactComponent(component) {
  return isClassComponent(component) || isFunctionComponent(component)
}

export function isElement(element) {
  return React.isValidElement(element);
}

export function isDOMTypeElement(element) {
  return isElement(element) && typeof element.type === 'string'
}

export function isCompositeTypeElement(element) {
  return isElement(element) && typeof element.type === 'function'
}
