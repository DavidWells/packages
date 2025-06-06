
export default function addSVGtoDOM(opts = {}) {
  const spriteId = (typeof opts === 'object') ? opts.spriteId : 'svg-sprite'
  const spriteContent = (typeof opts === 'object') ? opts.sprite : opts
  let svg = document.getElementById(spriteId)
  // SVG sprite already exists, return it
  if (svg) {
    return svg
  }
  // Create SVG
  svg = document.createElementNS(null, 'svg')
  svg.setAttribute('width', '0')
  svg.setAttribute('height', '0')
  svg.setAttribute('style', 'display: none')
  // svg.setAttributeNS('http://www.w3.org/2000/xmlns/', 'xmlns:xlink', 'http://www.w3.org/1999/xlink')

  svg.setAttribute('id', spriteId)
  document.body.appendChild(svg)

  const receptacle = document.createElement('div')
  const svgfragment = `<svg>${spriteContent}</svg>`
  receptacle.innerHTML = `${svgfragment}`
  Array.prototype.slice.call(receptacle.childNodes[0].childNodes).forEach((el) => {
    svg.appendChild(el)
  })
  return svg
}
