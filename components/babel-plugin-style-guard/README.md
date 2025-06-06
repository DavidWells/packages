# Style Guard Babel Plugin

Use proxies in dev to guard against potentially missing styles for CSS modules.

## Install

```
npm install babel-plugin-style-guard -D
```

To use, add to your babel config

```
{
  plugins: [
    'babel-plugin-style-guard',
  ],
}
```

After adding to babel config, all CSS modules will be automatically wrapped with [style guard](https://www.npmjs.com/package/style-guard) in DEV mode.

## Example

In:

```js
import React from 'react'
import styles from './styles.css'

export default function NavBar(props) {
  const { auth, handleLogout } = props
  return (
    <div className={styles.thing}>
      <span className={styles.doesNotExist}>
        xyz
      </span>
    </div>
  )
}
```

Out:

```js
import React from 'react'
import __styles from './styles.css'
import styleGuard from 'style-guard'

// Automatically gaurd styles in dev mode
const styles = styleGuard(__styles)
// styles is now proxied object in dev to throw if unknown properties are called

export default function NavBar(props) {
  const { auth, handleLogout } = props
  return (
    <div className={styles.thing}>
      <span className={styles.doesNotExist}>
        xyz
      </span>
    </div>
  )
}

/*
  styles.doesNotExist will cause a dev error because its missing or has been removed!
*/
```

Now unknown class names will throw errors in dev mode.

Resulting in an error like so:

![image](https://user-images.githubusercontent.com/532272/103469934-54af5100-4d20-11eb-99d8-144a1065cf14.png)

This will help prevent style regressions in dev mode
