import { AsyncLocalStorage } from 'node:async_hooks'
import z from '@deepseek-ai/schemastery'
import { isObject, mergeObjects, parseBody } from './rules.js'
import type { JsonObject } from './rules.js'

export { parseBody } from './rules.js'

export const name = 'dsh-extra-body'
export const inject = ['settings', 'llm']

const ENTRY_ID = 'extra-body'
const NAMESPACE = 'dsh-extra-body'
const fields = {
  rules: z.array(z.object({
    provider: z.string().required(),
    model: z.string().required(),
    body: z.string().required(),
  })).default([]),
}

// New DSH releases derive the Loader entry's settings form from this export.
export const Config = z.object(fields).default({ rules: [] }).volatile()
const legacyConfig = z.object(fields).default({ rules: [] })

interface RuleContext {
  model: string
  body: JsonObject
}
interface ActiveRule extends RuleContext { active: boolean }
interface SettingsScope { get(): unknown }
interface HostSettings {
  register?: (namespace: string, schema: unknown, options: Record<string, unknown>) => SettingsScope
  describe?: () => unknown
}
interface HostContext {
  settings: HostSettings
  fiber?: { entry?: { options?: { id?: string } } }
  on(event: string, listener: (options: unknown, next: unknown) => unknown): unknown
  effect(factory: () => () => void, label: string): unknown
}

type FetchInput = Parameters<typeof fetch>[0]
type FetchInit = Parameters<typeof fetch>[1]

/** Rewrite a JSON model request made during the selected DSH LLM stream. */
export async function patchRequest(input: FetchInput, init: FetchInit, rule: RuleContext): Promise<RequestInit | undefined> {
  const url = typeof input === 'string' || input instanceof URL ? String(input) : input?.url
  if (typeof url !== 'string') return undefined
  let protocol: string
  try { protocol = new URL(url).protocol } catch { return undefined }
  if (protocol !== 'http:' && protocol !== 'https:') return undefined
  const method = init?.method ?? (typeof Request !== 'undefined' && input instanceof Request ? input.method : undefined)
  if (String(method ?? 'GET').toUpperCase() !== 'POST') return undefined

  const headers = new Headers(typeof Request !== 'undefined' && input instanceof Request ? input.headers : undefined)
  if (init?.headers !== undefined) new Headers(init.headers).forEach((value, header) => headers.set(header, value))
  const contentType = headers.get('content-type')
  if (contentType !== null && !/\bjson\b/i.test(contentType)) return undefined

  const source = typeof init?.body === 'string' ? init.body
    : typeof Request !== 'undefined' && input instanceof Request && init?.body === undefined
      ? await input.clone().text()
      : undefined
  if (source === undefined) return undefined

  let payload: unknown
  try { payload = JSON.parse(source) } catch { return undefined }
  if (!isObject(payload) || payload.model !== rule.model) return undefined
  return { ...init, body: JSON.stringify(mergeObjects(payload, rule.body)) }
}

function bindStream<T>(source: AsyncIterable<T>, storage: AsyncLocalStorage<ActiveRule>, rule: RuleContext): AsyncIterable<T> {
  return {
    [Symbol.asyncIterator](): AsyncIterableIterator<T> {
      const iterator = source[Symbol.asyncIterator]()
      const activeRule: ActiveRule = { ...rule, active: true }
      return {
        next(value?: unknown): Promise<IteratorResult<T>> {
          return storage.run(activeRule, async () => {
            try {
              const result = await iterator.next(value as never)
              if (result.done) activeRule.active = false
              return result
            } catch (error) {
              activeRule.active = false
              throw error
            }
          })
        },
        return(value?: T): Promise<IteratorResult<T>> {
          return storage.run(activeRule, async () => {
            try { return await (iterator.return?.(value) ?? { done: true, value: value as T }) }
            finally { activeRule.active = false }
          })
        },
        throw(error?: unknown): Promise<IteratorResult<T>> {
          return storage.run(activeRule, async () => {
            try { return await (iterator.throw?.(error) ?? Promise.reject(error)) }
            finally { activeRule.active = false }
          })
        },
        [Symbol.asyncIterator]() { return this },
      }
    },
  }
}

function settingsValue(settings: HostSettings, scope: SettingsScope | undefined, entryId: string): Record<string, unknown> | undefined {
  try {
    const value = scope !== undefined ? scope.get() : (() => {
      const descriptors = settings.describe?.()
      if (!Array.isArray(descriptors)) return undefined
      const descriptor = descriptors.find(item => isObject(item) && item.ns === entryId)
      return isObject(descriptor) ? descriptor.value : undefined
    })()
    return isObject(value) ? value : undefined
  } catch { return undefined }
}

/** Register settings and insert JSON fields into matching outgoing requests. */
export function apply(ctx: HostContext): void {
  const settings = ctx.settings
  const scope = typeof settings.register === 'function'
    ? settings.register(NAMESPACE, legacyConfig, { applies: 'live' })
    : undefined
  const entryId = ctx.fiber?.entry?.options?.id || ENTRY_ID
  const storage = new AsyncLocalStorage<ActiveRule>()
  const invalidRules = new Set<string>()

  const unsubscribe = ctx.on('llm/stream', (options, next) => {
    if (typeof next !== 'function') return undefined
    const source = (next as () => AsyncIterable<unknown>)()
    if (!isObject(options)) return source
    const config = settingsValue(settings, scope, entryId)
    const rows = Array.isArray(config?.rules) ? config.rules : []
    const row = rows.find(item => isObject(item) && item.provider === options.provider && item.model === options.model)
    if (!isObject(row)) return source
    try {
      const body = parseBody(row.body)
      return bindStream(source, storage, { model: String(row.model), body })
    } catch (error) {
      const identity = `${row.provider}/${row.model}:${row.body}`
      if (!invalidRules.has(identity)) {
        invalidRules.add(identity)
        console.warn('[dsh-extra-body] invalid rule:', error)
      }
      return source
    }
  })

  const previousFetch = globalThis.fetch
  if (typeof previousFetch !== 'function') {
    console.warn('[dsh-extra-body] fetch unavailable; request body injection disabled')
    ctx.effect(() => () => {
      if (typeof unsubscribe === 'function') unsubscribe()
      storage.disable()
    }, 'dsh-extra-body: request listener')
    return
  }
  const wrappedFetch: typeof fetch = async (input, init) => {
    const rule = storage.getStore()
    const patched = rule?.active === true ? await patchRequest(input, init, rule) : undefined
    return previousFetch(input, patched ?? init)
  }
  globalThis.fetch = wrappedFetch

  ctx.effect(() => () => {
    if (typeof unsubscribe === 'function') unsubscribe()
    storage.disable()
    if (globalThis.fetch === wrappedFetch) globalThis.fetch = previousFetch
  }, 'dsh-extra-body: request JSON injection')
}
