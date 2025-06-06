import InputBase from '@davidwells/components-input'
import Input from './Input'
import { addListener } from '@analytics/listener-utils'
import { getCookie, setCookie } from '@analytics/cookie-utils'
import smoothscroll from 'smoothscroll-polyfill'
// import styles from './other.module.css'
// import x from './baz.module.css'
import './styles.css'

// kick off the polyfill!
smoothscroll.polyfill();

function App() {
  return (
    <>
      <a href="https://github.com/DavidWells/responsible" class="github-corner" aria-label="View source on GitHub">
        <svg viewBox="0 0 250 250" aria-hidden="true">
          <path d="M0,0 L115,115 L130,115 L142,142 L250,250 L250,0 Z" />
          <path
            d="M128.3,109.0 C113.8,99.7 119.0,89.6 119.0,89.6 C122.0,82.7 120.5,78.6 120.5,78.6 C119.2,72.0 123.4,76.3 123.4,76.3 C127.3,80.9 125.5,87.3 125.5,87.3 C122.9,97.6 130.6,101.9 134.4,103.2"
            fill="currentColor"
            style={{ transformOrigin: '130px 106px' }}
            class="octo-arm"
          />
          <path
            d="M115.0,115.0 C114.9,115.1 118.7,116.5 119.8,115.4 L133.7,101.6 C136.9,99.2 139.9,98.4 142.2,98.6 C133.8,88.0 127.5,74.4 143.8,58.0 C148.5,53.4 154.0,51.2 159.7,51.0 C160.3,49.4 163.2,43.6 171.4,40.1 C171.4,40.1 176.1,42.5 178.8,56.2 C183.1,58.6 187.2,61.8 190.9,65.4 C194.5,69.0 197.7,73.2 200.1,77.6 C213.8,80.2 216.3,84.9 216.3,84.9 C212.7,93.1 206.9,96.0 205.4,96.6 C205.1,102.4 203.0,107.8 198.3,112.5 C181.9,128.9 168.3,122.5 157.7,114.1 C157.9,116.9 156.7,120.9 152.7,124.9 L141.0,136.5 C139.8,137.7 141.6,141.9 141.8,141.8 Z" fill="currentColor"
            class="octo-body"
          />
        </svg>
      </a>


    <div id="top">
      <a href="https://github.com/davidwells/responsible">Fork me on <strong>Github</strong></a>.
    </div>
    <div className="wrap">
      <div id="content">
        <div className="inner">
            <div className='hero'>
              <h1>Better responsive apps</h1>
              <h2>Responsive web apps done right</h2>
            </div>
            <p className="buttons">
              <button onClick={toggleResponsive} target="_blank" className="button button-download">
                Toggle Mobile
              </button>

              <button onClick={toggleMobileDesktop} target="_blank" className="button button-download">
                Toggle Desktop
              </button>
            </p>
            <h2>Give visitors the choice of what mobile experience they want</h2>

            <p>Have you ever been on a responsive/mobile version of a site & thought:</p>

            <blockquote>"Man... this smashed responsive site sure is <strong>hard to navigate</strong> & is a pain in the <strong>ass to read</strong>. I wish I could <strong>view the desktop version on my phone</strong>"</blockquote>

            <h2 className="rad">Responsible.js solves this UX problem</h2>

            <p>Still confused? <strong>View this page on your mobile device or <a href="https://www.youtube.com/watch?v=VtSvk8xnmBE" target="_blank">watch the video</a></strong></p>

            <div id="video-wrapper">
            <div id="video">
                <iframe  width="960" height="720" src="https://www.youtube.com/embed/VtSvk8xnmBE" frameBorder="0" allowFullScreen></iframe>
            </div>
            </div>

            <p className="buttons download">
                <a href="https://github.com/davidwells/responsible" target="_blank" className="button bottom-button button-download">Download (5.123 kb)</a>
                <a href="https://github.com/davidwells/responsible" target="_blank" className="button bottom-button button-download">View on Github</a>
            </p>
            <div className="tagline-container">
            <hr />

            <div className="tagline">Be responsible about your responsive sites.</div>
            <hr />
            </div>
            <h2>Browser Compatibility</h2>
            <p>Tested in the latest versions of Chrome, Firefox, Safari, IE, and Opera. </p>
            <h2>Commercial Support</h2>
            <p>Under the MIT license, Responsible is free to use in commercial projects. If you're interested in commercial support to help with implementation, <a href="mailto:david@devshop.io">let's chat</a>.</p>
            <h2>Contact</h2>
            <p className="buttons">
                <a href="https://twitter.com/davidwells" target="_blank" className="button button-download">@DavidWells</a>

                <a href="http://devshop.io" className="button">DevShop.io</a>
            </p>
            <h2>License</h2>
            <p >Licensed under the MIT license.</p>
        </div>
      </div>
      </div>
    </>
  )
}

function Appx() {
  const handleChange = (_, value) => {
    console.log('input changed', value)
  }
  return (
    <div style={{ padding: 50 }} className={styles.wrapper}>
      <div className={styles.rule}>
        stuff
      </div>
      <a>test</a>
      <a href="https://google.com">test</a>
      <a href="http://google.com">test</a>

      <a className={styles.link}>
        Hello there
      </a>
      <br/><br/>

      <div className={styles.MyComponent}>
        cool
      </div>

      <div className={styles.levelOne}>
        one
         <div className={styles.levelTwo}>
          two
           <div className={styles.levelThree}>
             three
              <div className={styles.levelFour}>
                four
              </div>
           </div>
        </div>


      </div>

       <div className={styles.levelOne}>
          one
         <div className={styles.levelFour}>
           four inside
           <div>div inside 4</div>
           <div>div inside 4-1</div>
         </div>
      </div>
      <div className={styles.levelFour}>
        four outside
      </div>

      <br />

      <div className={styles.a}>
        a
         <div className={styles.b}>
            b inside a
         </div>
      </div>

      <div className={styles.b}>
          b outside
       </div>

      <div>
        <button className={styles.linkTwo}>
          two
        </button>
      </div>
      {/* <img src="http://www.fillmurray.com/g/900/900" className={styles.image} /> */}
      {/* <div className={styles.item}>
        grid
      </div> */}
      <div>
        <p> Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer vitae mauris arcu, eu pretium nisi. Praesent fringilla ornare ullamcorper. Pellentesque diam orci, sodales in blandit ut, placerat quis felis. Vestibulum at sem massa, in tempus nisi. Vivamus ut fermentum odio. Etiam porttitor faucibus volutpat. Vivamus vitae mi ligula, non hendrerit urna. Suspendisse potenti. Quisque eget massa a massa semper mollis.</p>
        <p> Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer vitae mauris arcu, eu pretium nisi. Praesent fringilla ornare ullamcorper. Pellentesque diam orci, sodales in blandit ut, placerat quis felis. Vestibulum at sem massa, in tempus nisi. Vivamus ut fermentum odio. Etiam porttitor faucibus volutpat. Vivamus vitae mi ligula, non hendrerit urna. Suspendisse potenti. Quisque eget massa a massa semper mollis.</p>
        <p> Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer vitae mauris arcu, eu pretium nisi. Praesent fringilla ornare ullamcorper. Pellentesque diam orci, sodales in blandit ut, placerat quis felis. Vestibulum at sem massa, in tempus nisi. Vivamus ut fermentum odio. Etiam porttitor faucibus volutpat. Vivamus vitae mi ligula, non hendrerit urna. Suspendisse potenti. Quisque eget massa a massa semper mollis.</p>
        <p> Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer vitae mauris arcu, eu pretium nisi. Praesent fringilla ornare ullamcorper. Pellentesque diam orci, sodales in blandit ut, placerat quis felis. Vestibulum at sem massa, in tempus nisi. Vivamus ut fermentum odio. Etiam porttitor faucibus volutpat. Vivamus vitae mi ligula, non hendrerit urna. Suspendisse potenti. Quisque eget massa a massa semper mollis.</p>
      </div>
      <Card>
        <InputBase placeholder='helxxxlo' onChange={handleChange} />
      </Card>
      <Card>
        <Input name='coxol' placeholder='helxxxlo' />
      </Card>
    </div>
  )
}

const KEY = 'responsible'
const MOBILE_THRESHOLD = 980
const TOGGLE_TEXT = 'Toggle Mobile Site'

function getViewPort() {
  var viewport = document.querySelector('meta[name=viewport]')
  if (viewport) {
    return viewport
  }
  // Else insert viewport
  viewport = document.createElement('meta')
  viewport.name = 'viewport'
  viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0'
  document.getElementsByTagName('head')[0].appendChild(viewport)
  return viewport
}

function randomize(n) {
  return n - Math.random()*0.01
}

function setInitialViewport() {
  const viewport = getViewPort()
  viewport.setAttribute('content', 'width=device-width, user-scalable=yes, initial-scale=1')
}

function setDesktopViewPort(width) {
  const viewport = getViewPort()
  const scale = randomize(.35)
  viewport.setAttribute('content', `width=${width}, user-scalable=yes, initial-scale=.25, maximum-scale=${scale}`)
  // viewport.setAttribute('content', `width=${width}, user-scalable=yes, initial-scale=${scale}, maximum-scale=${scale}`)
  // viewport.setAttribute('content', `width=${width}, user-scalable=yes, initial-scale=1, maximum-scale=1`)

  // tryZoomOut()
  // viewport.setAttribute('content', `width=${width}, user-scalable=yes, initial-scale=${randomize(.25)}, maximum-scale=${randomize(.35)}`)
  // viewport.setAttribute('content', `width=${width}, user-scalable=yes`)
}

function toggleMobileDesktop() {
  const responseStyles = document.querySelector('[id="responsive-css"]')
  const stylesheet = responseStyles.sheet || responseStyles.styleSheet
  if (!stylesheet.disabled) {
    stylesheet.disabled = true
    injectDesktopHeader()
    setDesktopViewPort(1280)
    // setScroll()
    setCookie(KEY, 'desktop')
  }
}

function setScroll() {
  setTimeout(() => {
    window.scroll({
      top: 0,
      behavior: 'smooth'
    })
  }, 50)
}

function toggleResponsive() {
  console.log('Toggle responsive')
  const responseStyles = document.querySelector('[id="responsive-css"]')
  const stylesheet = responseStyles.sheet || responseStyles.styleSheet
  if (stylesheet.disabled) {
    removeHeader()
    stylesheet.disabled = false
    setInitialViewport()
    setScroll()
    setCookie(KEY, 'responsive')
  }
}

function tryZoomOut() {
  const viewport = getViewPort()

  const original = viewport.attr("content");
  const force_scale = original + ", maximum-scale=1";
  viewport.attr("content", force_scale);
  setTimeout(function() {
    viewport.attr("content", original);
  }, 100);
}

function zoomOutMobile() {
  var viewport = document.querySelector('meta[name="viewport"]');

  if ( viewport ) {
    viewport.content = "initial-scale=0.1";
    viewport.content = "width=1200";
  }
}

function getWidth() {
  const elem = (document.compatMode === "CSS1Compat") ? document.documentElement : document.body
  return elem.clientWidth;
}

function removeHeader(node) {
  var toggle = node || document.getElementById('responsible-toggle')
  // If toggle exists dont add another
  if (!toggle) {
    return false
  }
  document.body.removeChild(toggle)
}

function injectDesktopHeader(opts = {}) {
  var toggle = document.getElementById('responsible-toggle')
  const currentWidth = getWidth()
  console.log('currentWidth', currentWidth)

  if (currentWidth > MOBILE_THRESHOLD) {
    console.log('On desktop dont do anything')
    // return
  }

  // If toggle exists dont add another
  if (toggle) {
    console.log('return early')
    return false
  }

  var firstElement = document.body.children[0]
  var div = document.createElement("div")
  div.id = "responsible-toggle";
  div.style.padding = "40px 0px 40px";
  div.style.width = "100%";
  div.style.color = "#eaeaea";
  div.style.fontSize = "60px";
  div.style.fontWeight = "bold";
  div.style.backgroundColor = "#444";
  div.style.textAlign = "center";
  div.style.cursor = "pointer";
  div.innerText = opts.desktopToggleText || TOGGLE_TEXT;
  // insert at top of page
  document.body.insertBefore(div, firstElement);
  const removeHandler = addListener(div, 'click', () => {
    removeHandler()
    toggleResponsive(div)
  })

  // const addHandler = removeListener(div, 'click', () => {
  //   console.log('Hey hey hey')
  // })

  // addHandler()
}

function listen(events, func, toAdd) {
  if (!inBrowser) return false
  let fn = window[(toAdd ? 'add' : 'remove') + 'EventListener']
  events.split(' ').forEach(ev => {
    fn(ev, func)
  })
}

export function check() {
  return Promise.resolve(!navigator.onLine)
}

export function watch(cb) {
  let fn = _ => check().then(cb)
  let listener = listen.bind(null, 'online offline', fn)
  listener(true)
  // return unsubscribe
  return _ => listener(false)
}

function Card({ children }) {
  return (
    <div style={{ padding: 30, marginBottom: 10, border: '1px solid blue' }}>
      {children}
    </div>
  )
}

export default App



/*
function oldToggle() {
  const responseStyles = document.querySelector('[id="responsive-css"]')
  if (responseStyles) {
    console.log(responseStyles)
    const stylesheet = responseStyles.sheet || responseStyles.styleSheet
    if (!stylesheet.disabled) {
      console.log('do it')
      setDesktopViewPort(1280)
      setCookie(KEY, 'desktop')
    } else {
      setInitialViewport()
      setCookie(KEY, 'responsive')
    }
    stylesheet.disabled = !stylesheet.disabled
  }
  injectDesktopHeader()
}
*/
