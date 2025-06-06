import React from 'react'
import { isElement, isClassComponent, isFunctionComponent } from './type-check'

export default function smartRender(componentOrString, propsToPass) {
  if (!componentOrString) return null
  // console.log('componentOrString', componentOrString)
  // console.log('String(component)', String(componentOrString))

  if (typeof componentOrString === 'string' || isElement(componentOrString)) {
    // console.log('String or react element')
    return componentOrString
  }

  if (isClassComponent(componentOrString)) {
    // console.log('is uninstantiated class component')
    const RenderComponent = componentOrString
    return <RenderComponent {...propsToPass} />
  }

  if (isFunctionComponent(componentOrString)) {
    // console.log('is uninstantiated functional component')
    return componentOrString(propsToPass)
  }

  if (Array.isArray(componentOrString)) {
    return componentOrString.map((x) => {
      return smartRender(x, propsToPass)
    })
  }

  // Possibly precompiled react component with React.createElement inside
  if (typeof componentOrString === 'function') {
    // console.log('is uninstantiated functional component')
    return componentOrString(propsToPass)
  }

  // throw new Error('Invalid component passed')

  return componentOrString;
}
