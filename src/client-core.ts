import { isObject, parseBody } from './rules.js'

export interface Rule {
  provider: string
  model: string
  body: string
}

export interface InventoryModel {
  id: string
  name: string
  stale?: boolean
}

export type Inventory = Record<string, InventoryModel[]>

export interface SettingsSection {
  ns: string
  revision: number
  value?: Record<string, unknown>
}

export interface ClientReply {
  ok: boolean
  value?: unknown
  error?: { message?: string }
}

export interface SettingsOp {
  op: 'set'
  path: string[]
  value: Rule[]
}

export interface SettingsApi {
  describe(): Promise<ClientReply>
  mutate(ns: string, ops: SettingsOp[], revision: number): Promise<ClientReply>
}

export interface SettingsSnapshot {
  section: SettingsSection
  inventory: Inventory
  rules: Rule[]
  writable: boolean
}

function unwrap(response: unknown): ClientReply {
  const result = isObject(response) && isObject(response.result) ? response.result : response
  return result as ClientReply
}

/** Normalize the older connection RPC and the newer remote.settings service. */
export function settingsBridge(connection: unknown, remoteSettings: unknown): SettingsApi | undefined {
  const connectionRecord = isObject(connection) ? connection : undefined
  const api = isObject(connectionRecord?.api) ? connectionRecord.api : undefined
  const legacy = isObject(api?.settings) ? api.settings : undefined
  if (typeof legacy?.describe === 'function' && typeof legacy.mutate === 'function') {
    const describe = legacy.describe as (input: Record<string, never>) => Promise<unknown>
    const mutate = legacy.mutate as (input: { ns: string; ops: SettingsOp[]; expectedRevision: number }) => Promise<unknown>
    return {
      describe: async () => unwrap(await describe.call(legacy, {})),
      mutate: async (ns, ops, revision) => unwrap(await mutate.call(legacy, { ns, ops, expectedRevision: revision })),
    }
  }
  const modern = isObject(remoteSettings) ? remoteSettings : undefined
  if (typeof modern?.describe === 'function' && typeof modern.mutate === 'function') {
    const describe = modern.describe as () => Promise<unknown>
    const mutate = modern.mutate as (ns: string, ops: SettingsOp[], revision: number) => Promise<unknown>
    return {
      describe: async () => unwrap(await describe.call(modern)),
      mutate: async (ns, ops, revision) => unwrap(await mutate.call(modern, ns, ops, revision)),
    }
  }
  return undefined
}

export function readSettings(reply: ClientReply): SettingsSnapshot {
  if (reply?.ok !== true) throw new Error(reply?.error?.message || '无法读取 DSH 设置')
  const value = isObject(reply.value) ? reply.value : undefined
  const namespaces = value?.namespaces
  if (!Array.isArray(namespaces)) throw new Error('DSH 设置响应缺少分区列表')
  const sectionRaw = namespaces.find(item => isObject(item) && (item.ns === 'extra-body' || item.ns === 'dsh-extra-body'))
  if (!isObject(sectionRaw) || typeof sectionRaw.ns !== 'string') throw new Error('找不到请求附加字段设置分区，请确认宿主插件已加载')
  const section: SettingsSection = {
    ns: sectionRaw.ns,
    revision: typeof sectionRaw.revision === 'number' ? sectionRaw.revision : NaN,
    value: isObject(sectionRaw.value) ? sectionRaw.value : undefined,
  }
  const piAi = namespaces.find(item => isObject(item) && item.ns === 'llm-pi-ai')
  const providerValue = isObject(piAi) && isObject(piAi.value) ? piAi.value.providers : undefined
  const providers = isObject(providerValue) ? providerValue : {}
  const inventory: Inventory = Object.fromEntries(Object.entries(providers).map(([route, rawProfile]) => {
    const profile = isObject(rawProfile) ? rawProfile : undefined
    const models = new Map<string, InventoryModel>()
    if (Array.isArray(profile?.models)) {
      for (const entry of profile.models) {
        const raw = isObject(entry) ? entry : undefined
        if (typeof raw?.id !== 'string' || raw.id.length === 0) continue
        models.set(raw.id, { id: raw.id, name: typeof raw.name === 'string' && raw.name ? raw.name : raw.id })
      }
    }
    const overrides = isObject(profile?.modelOverrides) ? profile.modelOverrides : undefined
    if (overrides) {
      for (const [id, entry] of Object.entries(overrides)) {
        const raw = isObject(entry) ? entry : undefined
        if (!models.has(id)) models.set(id, { id, name: typeof raw?.name === 'string' && raw.name ? raw.name : id })
      }
    }
    return [route, [...models.values()]]
  }))
  const rawRules = section.value?.rules
  const rules: Rule[] = Array.isArray(rawRules) ? rawRules.map(row => {
    const raw = isObject(row) ? row : undefined
    return { provider: String(raw?.provider ?? ''), model: String(raw?.model ?? ''), body: String(raw?.body ?? '') }
  }) : []
  return { section, inventory, rules, writable: value?.writable !== false }
}

export function validateRules(rows: Rule[]): Rule[] {
  const seen = new Set<string>()
  return rows.map((row, index) => {
    const provider = row.provider.trim()
    const model = row.model.trim()
    if (!provider || !model) throw new Error(`第 ${index + 1} 条：请选择 provider 并填写模型 ID`)
    const key = JSON.stringify([provider, model])
    if (seen.has(key)) throw new Error(`第 ${index + 1} 条：同一个 provider 和模型已有规则`)
    seen.add(key)
    try { parseBody(row.body) }
    catch (error) { throw new Error(`第 ${index + 1} 条：${error instanceof Error ? error.message : String(error)}`) }
    return { provider, model, body: row.body.trim() }
  })
}

/** Group the live model inventory, retaining rules whose models disappeared. */
export function modelGroups(inventory: Inventory, rules: Rule[], query = ''): Array<{ route: string; models: InventoryModel[]; configured: number }> {
  const routes = [...new Set([...Object.keys(inventory), ...rules.map(row => row.provider)])]
  const search = query.trim().toLowerCase()
  return routes.map(route => {
    const listed = inventory[route] ?? []
    const known = new Set(listed.map(item => item.id))
    const stale = rules.filter(row => row.provider === route && !known.has(row.model))
      .map(row => ({ id: row.model, name: row.model, stale: true }))
    const models = [...listed, ...stale].filter(item => !search || route.toLowerCase().includes(search) || item.id.toLowerCase().includes(search) || item.name.toLowerCase().includes(search))
    return { route, models, configured: rules.filter(row => row.provider === route).length }
  }).filter(group => group.models.length)
}
