import {
  getEnvVariable,
  getMappingFilePath,
  isExcludedFile,
  isJsTypeFile,
  normalizePath,
  resetFileRecord,
  transformCode
} from '@code-inspector/core'
import { ViteCodeInspectorPlugin } from '@code-inspector/vite'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const jsxQueryKeys = ['isJsx', 'isTsx', 'lang.jsx', 'lang.tsx']
const packageSourceRecordPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  'record.json'
)

export function CodeInspectorPlugin (options) {
  if (!options?.bundler) {
    console.log(
      'Please specify the bundler in the options of @davidwells/code-inspector-plugin.'
    )
    return undefined
  }

  let close = false
  if (options.needEnvInspector) {
    close = getEnvVariable('CODE_INSPECTOR', process.cwd()) !== 'true'
  }

  const pluginOutput = path.resolve(
    process.cwd(),
    'node_modules/.cache/davidwells-code-inspector-plugin'
  )
  fs.mkdirSync(pluginOutput, { recursive: true })

  const resolvedOptions = {
    ...options,
    hotKeys: options.hotKeys ?? ['altKey'],
    close,
    output: pluginOutput
  }

  resetFileRecord(resolvedOptions.output)
  removePackageSourceRecord()

  if (options.bundler !== 'vite') {
    throw new Error('@davidwells/code-inspector-plugin only supports Vite.')
  }

  return createViteCodeInspectorPlugin(resolvedOptions)
}

export const codeInspectorPlugin = CodeInspectorPlugin

function createViteCodeInspectorPlugin (options) {
  const devPlugin = ViteCodeInspectorPlugin(options)
  let command = 'serve'

  return {
    name: 'davidwells:code-inspector-plugin',
    ...(options.enforcePre === false ? {} : { enforce: 'pre' }),
    apply (_, env) {
      command = env.command
      return (
        !options.close &&
        (env.command === 'build' || isEnabled(options.dev, env.command === 'serve'))
      )
    },
    config (config, env) {
      command = env.command
      return devPlugin.config?.call(this, config, env)
    },
    configResolved (config) {
      return devPlugin.configResolved?.call(this, config)
    },
    async transform (code, id) {
      if (command !== 'build') {
        return devPlugin.transform?.call(this, code, id)
      }

      return transformPathAttributesOnly(code, id, options)
    },
    async transformIndexHtml (html, context) {
      if (command === 'build') {
        return html
      }

      return devPlugin.transformIndexHtml?.call(this, html, context) ?? html
    },
    configureServer (server) {
      return devPlugin.configureServer?.call(this, server)
    },
    closeBundle () {
      if (command === 'build') {
        removePackageSourceRecord()
      }
    }
  }
}

function removePackageSourceRecord () {
  fs.rmSync(packageSourceRecordPath, { force: true })
}

function isEnabled (userDev, systemDev) {
  const resolved = typeof userDev === 'function' ? userDev() : userDev
  return resolved === false ? false : Boolean(resolved || systemDev)
}

async function transformPathAttributesOnly (code, id, options) {
  if (isExcludedFile(id, options)) {
    return code
  }

  const { escapeTags = [], mappings } = options
  const [rawFilePath, rawQuery] = id.split('?', 2)
  let filePath = normalizePath(rawFilePath)
  filePath = getMappingFilePath(filePath, mappings)

  if (options.match && !options.match.test(filePath)) {
    return code
  }

  const query = new URLSearchParams(rawQuery)
  const fileType = detectFileType(filePath, query)
  if (!fileType) {
    return code
  }

  return transformCode({
    content: code,
    filePath,
    fileType,
    escapeTags,
    pathType: options.pathType
  })
}

function detectFileType (filePath, query) {
  if (
    isJsTypeFile(filePath) ||
    (filePath.endsWith('.vue') &&
      (jsxQueryKeys.some((key) => query.has(key)) ||
        query.get('lang') === 'tsx' ||
        query.get('lang') === 'jsx'))
  ) {
    return 'jsx'
  }

  if (
    (filePath.endsWith('.html') &&
      query.get('type') === 'template' &&
      query.has('vue')) ||
    (filePath.endsWith('.vue') &&
      query.get('type') !== 'style' &&
      query.get('raw') === null)
  ) {
    return 'vue'
  }

  if (filePath.endsWith('.svelte')) {
    return 'svelte'
  }

  return ''
}
