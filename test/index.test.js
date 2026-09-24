import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import { apply, parseBody, patchRequest } from '../lib/index.js'

const originalFetch = globalThis.fetch
afterEach(() => { globalThis.fetch = originalFetch })

test('parseBody accepts extra fields and rejects unsafe or core fields', () => {
  assert.deepEqual(parseBody('{"requesty":{"auto_cache":true}}'), { requesty: { auto_cache: true } })
  assert.throws(() => parseBody('{"model":"other"}'))
  assert.throws(() => parseBody('{"requesty":{"__proto__":{}}}'))
  assert.throws(() => parseBody('[]'))
})

test('patchRequest merges matching JSON bodies across model endpoints', async () => {
  const init = {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ model: 'model-a', messages: [], requesty: { tags: ['existing'] } }),
  }
  const rule = { model: 'model-a', body: { requesty: { auto_cache: true } } }
  const next = await patchRequest('https://router.requesty.ai/v1/chat/completions', init, rule)
  assert.deepEqual(JSON.parse(next.body), {
    model: 'model-a', messages: [], requesty: { tags: ['existing'], auto_cache: true },
  })
  assert.equal(JSON.parse(init.body).requesty.auto_cache, undefined)
  for (const path of ['/v1/responses', '/anthropic/v1/messages', '/v1/generate']) {
    const result = await patchRequest(`https://router.requesty.ai${path}`, init, rule)
    assert.equal(JSON.parse(result.body).requesty.auto_cache, true)
  }
  assert.equal(await patchRequest('https://router.requesty.ai/v1/models', { ...init, method: 'GET' }, rule), undefined)
  assert.equal(await patchRequest('https://router.requesty.ai/v1/responses', { ...init, body: '{}' }, rule), undefined)
  assert.equal(await patchRequest('https://router.requesty.ai/v1/responses', init, { model: 'other', body: {} }), undefined)
  assert.equal(await patchRequest('https://router.requesty.ai/v1/responses', { ...init, headers: { 'content-type': 'text/plain' } }, rule), undefined)
})

test('patchRequest reads a Request body without consuming the original', async () => {
  const request = new Request('https://router.requesty.ai/v1/responses', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ model: 'model-a', input: 'hello' }),
  })
  const result = await patchRequest(request, undefined, { model: 'model-a', body: { requesty: { auto_cache: true } } })
  assert.equal(JSON.parse(result.body).requesty.auto_cache, true)
  assert.equal(JSON.parse(await request.text()).requesty, undefined)
})

test('middleware scopes injection to the selected provider and model', async () => {
  const requests = []
  const fakeFetch = async (_input, init) => {
    requests.push(JSON.parse(init.body))
    return { ok: true }
  }
  globalThis.fetch = fakeFetch
  let listener
  let dispose
  const ctx = {
    settings: {
      register() { return { get: () => ({ rules: [{ provider: 'requesty', model: 'model-a', body: '{"requesty":{"auto_cache":true}}' }] }) } },
    },
    on(_event, callback) { listener = callback; return () => {} },
    effect(callback) { dispose = callback() },
  }
  apply(ctx)
  const generate = (model) => listener({ provider: 'requesty', model }, async function* () {
    await globalThis.fetch('https://router.requesty.ai/v1/chat/completions', {
      method: 'POST', body: JSON.stringify({ model, messages: [] }),
    })
    yield 'done'
  })
  for await (const _ of generate('model-a')) {}
  for await (const _ of generate('model-b')) {}
  assert.deepEqual(requests[0].requesty, { auto_cache: true })
  assert.equal(requests[1].requesty, undefined)
  dispose()
  assert.equal(globalThis.fetch, fakeFetch)
})

test('entry-config settings and completed stream context work independently', async () => {
  const requests = []
  globalThis.fetch = async (_input, init) => {
    requests.push(JSON.parse(init.body))
    return { ok: true }
  }
  let listener
  let dispose
  let delayedFetch
  let releaseFetch
  const gate = new Promise(resolve => { releaseFetch = resolve })
  apply({
    fiber: { entry: { options: { id: 'custom-extra-body' } } },
    settings: {
      describe: () => [{ ns: 'custom-extra-body', value: {
        rules: [{ provider: 'requesty', model: 'model-a', body: '{"requesty":{"auto_cache":true}}' }],
      } }],
    },
    on(_event, callback) { listener = callback; return () => {} },
    effect(callback) { dispose = callback() },
  })
  const stream = listener({ provider: 'requesty', model: 'model-a' }, async function* () {
    delayedFetch = (async () => {
      await gate
      await globalThis.fetch('https://router.requesty.ai/v1/chat/completions', {
        method: 'POST', body: JSON.stringify({ model: 'model-a', messages: [] }),
      })
    })()
    await globalThis.fetch('https://router.requesty.ai/v1/chat/completions', {
      method: 'POST', body: JSON.stringify({ model: 'model-a', messages: [] }),
    })
    yield 'done'
  })
  for await (const _ of stream) {}
  releaseFetch()
  await delayedFetch
  assert.deepEqual(requests[0].requesty, { auto_cache: true })
  assert.equal(requests[1].requesty, undefined)
  dispose()
})
