import React from 'react'
import Form from '@davidwells/components-form'

export default function App() {
  const handle = (event, data, what) => {
    console.log('event', event)
    console.log('form data', data)
    alert('yo')
  }
  return (
    <Form onSubmit={handle}>
      <input name='cool'></input>
      <button>submit</button>
    </Form>
  )
}
