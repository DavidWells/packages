# Flex

> Flex component

[![NPM](https://img.shields.io/npm/v/forms.svg)](https://www.npmjs.com/package/forms) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

## Install

```bash
npm install --save @davidwells/components-flex
```

## Usage

```jsx
import React, { Component } from 'react'

import { Flex, Column, Row } from '@davidwells/components-flex'
import '@davidwells/components-flex/dist/index.css'

class Example extends Component {
  render() {
    return (
      <Column isFullScreen>
        <Row auto>
          <div>one</div>
          <div>two</div>
          <div>three</div>
        </Row>
        <Column auto>
          <span>hi</span>
          <span>hi</span>
          <span>hi</span>
          <Row>
            <span>hi</span>
            <span>hi</span>
            <span>hi</span>
          </Row>
        </Column>
      </Column>
    )
  }
}
```

## License

MIT © [DavidWells](https://github.com/DavidWells)
