import React from 'react'
import ReactDOM from 'react-dom'
import SVGSprite from './assets/icons/sprite'
import { addSVGtoDOM } from '@davidwells/components-icon'
import App from './App'

addSVGtoDOM(SVGSprite)

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);
