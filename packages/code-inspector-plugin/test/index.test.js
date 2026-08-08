import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { codeInspectorPlugin, CodeInspectorPlugin } from '../src/index.js'

test('exports the plugin under both supported names', () => {
  assert.equal(codeInspectorPlugin, CodeInspectorPlugin)
})

test('creates a pre-enforced Vite plugin', async () => {
  await withTemporaryWorkingDirectory(() => {
    const plugin = CodeInspectorPlugin({ bundler: 'vite' })

    assert.equal(plugin.name, 'davidwells:code-inspector-plugin')
    assert.equal(plugin.enforce, 'pre')
    assert.equal(plugin.apply({}, { command: 'serve' }), true)
    assert.equal(plugin.apply({}, { command: 'build' }), true)
  })
})

test('rejects unsupported bundlers', async () => {
  await withTemporaryWorkingDirectory(() => {
    assert.throws(
      () => CodeInspectorPlugin({ bundler: 'webpack' }),
      /only supports Vite/
    )
  })
})

test('production transforms retain source path attributes without client injection', async () => {
  await withTemporaryWorkingDirectory(async (workingDirectory) => {
    const plugin = CodeInspectorPlugin({ bundler: 'vite' })
    plugin.apply({}, { command: 'build' })

    const sourcePath = path.join(workingDirectory, 'src', 'App.jsx')
    const source = 'export function App() { return <main>Hello</main> }'
    fs.mkdirSync(path.dirname(sourcePath), { recursive: true })
    fs.writeFileSync(sourcePath, source)
    const transformed = await plugin.transform(
      source,
      sourcePath
    )

    assert.match(transformed, /data-insp-path=/)
    assert.equal(
      await plugin.transformIndexHtml('<main>Hello</main>', {}),
      '<main>Hello</main>'
    )
  })
})

async function withTemporaryWorkingDirectory (callback) {
  const previousWorkingDirectory = process.cwd()
  const workingDirectory = fs.mkdtempSync(
    path.join(os.tmpdir(), 'code-inspector-plugin-')
  )

  try {
    process.chdir(workingDirectory)
    return await callback(workingDirectory)
  } finally {
    process.chdir(previousWorkingDirectory)
    fs.rmSync(workingDirectory, { recursive: true, force: true })
  }
}
