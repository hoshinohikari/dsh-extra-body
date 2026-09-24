import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { test } from 'node:test'

test('package exports every declared DSH bundle', () => {
  const manifest = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
  assert.equal(manifest.dsh.bundle.patch, './cordis.patch.yml')
  assert.equal(manifest.dsh.client.platform, 'web')
  for (const specifier of ['.', './client', './cordis.patch.yml']) {
    const target = manifest.exports[specifier]
    assert.equal(typeof target, 'string', `missing export ${specifier}`)
    assert.equal(existsSync(new URL(`../${target}`, import.meta.url)), true, `missing file ${target}`)
  }
})
