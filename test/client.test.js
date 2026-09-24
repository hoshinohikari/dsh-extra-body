import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { runInNewContext } from 'node:vm'
import { modelGroups, readSettings, settingsBridge, validateRules } from '../src/client-core.js'

const namespaces = [
  { ns: 'extra-body', revision: 4, value: { rules: [{ provider: 'requesty', model: 'model-a', body: '{"requesty":{"auto_cache":true}}' }] } },
  { ns: 'llm-pi-ai', value: { providers: { requesty: { models: [{ id: 'model-a' }, { id: 'model-b' }] } } } },
]

test('settings bridge accepts both Desktop transports', async () => {
  const calls = []
  const legacy = settingsBridge({ api: { settings: {
    describe: async input => { calls.push(['legacy-describe', input]); return { result: { ok: true, value: { namespaces } } } },
    mutate: async input => { calls.push(['legacy-mutate', input]); return { result: { ok: true, value: namespaces[0] } } },
  } } })
  assert.equal((await legacy.describe()).ok, true)
  await legacy.mutate('extra-body', [{ op: 'set', path: ['rules'], value: [] }], 4)
  assert.deepEqual(calls[1][1], { ns: 'extra-body', ops: [{ op: 'set', path: ['rules'], value: [] }], expectedRevision: 4 })

  const modern = settingsBridge(undefined, {
    describe: async () => ({ ok: true, value: { namespaces } }),
    mutate: async (...args) => { calls.push(['modern-mutate', args]); return { ok: true, value: namespaces[0] } },
  })
  assert.equal((await modern.describe()).ok, true)
  await modern.mutate('extra-body', [], 4)
  assert.deepEqual(calls.at(-1)[1], ['extra-body', [], 4])
})

test('settings snapshot supplies model choices and validates rows', () => {
  const snapshot = readSettings({ ok: true, value: { namespaces, writable: true } })
  assert.deepEqual(snapshot.inventory.requesty, [{ id: 'model-a', name: 'model-a' }, { id: 'model-b', name: 'model-b' }])
  assert.equal(snapshot.section.revision, 4)
  assert.deepEqual(validateRules(snapshot.rules), snapshot.rules)
  assert.throws(() => validateRules([...snapshot.rules, ...snapshot.rules]), /已有规则/)
  assert.throws(() => validateRules([{ ...snapshot.rules[0], body: '{"model":"other"}' }]), /cannot replace model/)
})

test('model groups discover provider models and retain stale configured rules', () => {
  const groups = modelGroups({ requesty: [{ id: 'live', name: 'Live Model' }] }, [
    { provider: 'requesty', model: 'gone', body: '{}' },
  ])
  assert.deepEqual(groups[0].models, [
    { id: 'live', name: 'Live Model' },
    { id: 'gone', name: 'gone', stale: true },
  ])
  assert.equal(groups[0].configured, 1)
  assert.deepEqual(modelGroups({ requesty: [{ id: 'live', name: 'Live Model' }] }, [], 'live model')[0].models.map(item => item.id), ['live'])
})

test('browser bundle registers a Desktop settings section', () => {
  let registration
  let render
  const source = readFileSync(new URL('../lib/client.js', import.meta.url), 'utf8')
  runInNewContext(source, {
    window: { __ModuleLoader__: { load(entry) { registration = entry } } },
  })
  assert.equal(registration.id, 'dsh-extra-body')
  let hookIndex = 0
  const hookValues = [false, '', '', '', namespaces[0], { requesty: [{ id: 'model-a', name: 'Model A' }] }, namespaces[0].value.rules, {}, '', { requesty: true }, {}, true]
  const react = {
    createElement: (type, props, ...children) => ({ type, props, children }),
    useState(initial) { return [hookValues[hookIndex++] ?? initial, () => {}] },
    useCallback(callback) { return callback },
    useEffect() {},
  }
  const client = registration.factory(specifier => {
    assert.equal(specifier, 'react')
    return react
  })
  let descriptor
  client.apply({
    get(name) {
      if (name === 'slots') return { inject(_slot, register) { register() }, register(value, component) { descriptor = value; render = component; return () => {} } }
      if (name === 'connection') return { api: { settings: { describe() {}, mutate() {} } } }
      return undefined
    },
    on() {},
  })
  assert.equal(descriptor.id, 'dsh-extra-body')
  assert.equal(descriptor.label(), '请求附加字段')
  const element = render()
  const tree = element.type(element.props)
  const words = JSON.stringify(tree)
  assert.match(words, /requesty/)
  assert.match(words, /model-a/)
})
