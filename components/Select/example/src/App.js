import React, { useCallback } from 'react'
import '@davidwells/components-select/dist/index.css'
import { Item } from '@react-stately/collections'
import {
  Select,
  Other,
  CustomSelect,
  // SelectSearch
} from '@davidwells/components-select'
import testStyles from './Test.module.css'

function classes(classNames) {
  console.log('classNames', classNames)
  return Object.entries(classNames).filter(([cls, display]) => {
    console.log('cls', cls)
    console.log('display', display)
    return cls && display
  })
  .map(([cls]) => cls)
  .join(' ')
}

function useClassName(className) {
  return useCallback((key) => {
    console.log('keykey', key)
    if (typeof className === 'function') {
      const mappedValue = className(key)
      if (mappedValue) return mappedValue
    }

    if (key.indexOf('container') === 0) {
      return key.replace('container', className)
    }

    if (key.indexOf('is-') === 0 || key.indexOf('has-') === 0) {
      return key
    }

    return `${className.split(' ')[0]}__${key}`
  }, [className])
}


const styles = {
  container: 'cssModule'
}
console.log('testStyles', testStyles)
const className = (key) => {
  console.log('key', key)
  console.log('testStyles[key]', testStyles[key])
  return testStyles[key]
}

export default function App() {
 const items = [
    'Red',
    'Organge',
    'green',
    'blue'
  ]
  const selectItems = items.map((x) => {
    return <div key={x}>{x}x</div>
  })

  const cls = useClassName(className);

  console.log('cls', cls)

  const wrapperClass = classes({
    [cls('container')]: true,
    [cls('is-disabled')]: true,
    [cls('is-loading')]: false,
    [cls('has-focus')]: true,
  })
  console.log('wrapperClass', wrapperClass)

  const options = [
    { name: 'Swedish', value: 'sv'},
    { name: 'English', value: 'en'},
    {
      type: 'group',
      name: 'Group name',
      items: [
        {name: 'Spanish', value: 'es'},
      ]
    },
  ];

  return (
    <div>
      <div>
        {/* <SelectSearch options={options} value="sv" name="language" placeholder="Choose your language" /> */}
      </div>
      <div style={{padding: 40}}>
        <CustomSelect label="Size">
          <Item key="s">Small</Item>
          <Item key="m">Medium</Item>
          <Item key="l">Large</Item>
        </CustomSelect>
      </div>
      <div style={{padding: 40}}>
        <Select
          onChange={() => { console.log('changed')}}
          label="test"
          options={[
            { label: "Hello", value: "one" },
            { label: "World", value: "two" },
          ]}
        />
      </div>
      <div style={{padding: 40}}>
         <Other
           label="Favorite Color"
           options={[
             { label: "Yo", value: "x" },
             { label: "Hello", value: "lol" },
             { label: "World", value: "sick" },
           ]}
          onChange={(val, item) => { console.log('changed', val, item)}}>
            {selectItems}
          </Other>
      </div>
      {/* <div style={{padding: 40}}>
         <Other label="Favorite Color" onChange={() => { console.log('changed')}}>
            {selectItems}
          </Other>
      </div> */}
    </div>
  )
}
