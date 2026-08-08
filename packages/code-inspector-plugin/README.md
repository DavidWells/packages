# @davidwells/code-inspector-plugin

A Vite-only wrapper around [`code-inspector-plugin`](https://github.com/zh-lx/code-inspector) that keeps source-path attributes in production builds without injecting the inspector's browser client.

In development, it provides the standard click-to-open-in-editor inspector. In production builds, it adds only the `data-insp-path` attributes, making the source mapping available to your own tooling without shipping the inspector UI or server integration.

## Install

```sh
npm install --save-dev @davidwells/code-inspector-plugin
```

## Usage

```js
import { defineConfig } from 'vite'
import { codeInspectorPlugin } from '@davidwells/code-inspector-plugin'

export default defineConfig({
  plugins: [
    codeInspectorPlugin({
      bundler: 'vite'
    })
  ]
})
```

The plugin runs with `enforce: "pre"` by default so it can annotate source elements before other transforms. Set `enforcePre: false` to opt out.

### Environment-controlled inspection

Set `needEnvInspector: true` to require `CODE_INSPECTOR=true` before enabling the plugin:

```js
codeInspectorPlugin({
  bundler: 'vite',
  needEnvInspector: true
})
```

All other options are passed through to `@code-inspector/vite`.

## License

MIT
