import { parseBody } from '../lib/rules.js'

function unwrap(response) {
  return response?.result && typeof response.result === 'object' ? response.result : response
}

/** Normalize the older connection RPC and the newer remote.settings service. */
export function settingsBridge(connection, remoteSettings) {
  const legacy = connection?.api?.settings
  if (typeof legacy?.describe === 'function' && typeof legacy?.mutate === 'function') {
    return {
      describe: async () => unwrap(await legacy.describe({})),
      mutate: async (ns, ops, revision) => unwrap(await legacy.mutate({ ns, ops, expectedRevision: revision })),
    }
  }
  if (typeof remoteSettings?.describe === 'function' && typeof remoteSettings?.mutate === 'function') {
    return {
      describe: async () => unwrap(await remoteSettings.describe()),
      mutate: async (ns, ops, revision) => unwrap(await remoteSettings.mutate(ns, ops, revision)),
    }
  }
  return undefined
}

export function readSettings(reply) {
  if (reply?.ok !== true) throw new Error(reply?.error?.message || '无法读取 DSH 设置')
  const namespaces = reply.value?.namespaces
  if (!Array.isArray(namespaces)) throw new Error('DSH 设置响应缺少分区列表')
  const section = namespaces.find(item => item?.ns === 'extra-body' || item?.ns === 'dsh-extra-body')
  if (!section) throw new Error('找不到请求附加字段设置分区，请确认宿主插件已加载')
  const providerValue = namespaces.find(item => item?.ns === 'llm-pi-ai')?.value?.providers
  const providers = providerValue && typeof providerValue === 'object' && !Array.isArray(providerValue) ? providerValue : {}
  const inventory = Object.fromEntries(Object.entries(providers).map(([route, profile]) => {
    const models = new Map()
    if (Array.isArray(profile?.models)) {
      for (const raw of profile.models) {
        if (typeof raw?.id !== 'string' || raw.id.length === 0) continue
        models.set(raw.id, { id: raw.id, name: typeof raw.name === 'string' && raw.name ? raw.name : raw.id })
      }
    }
    const overrides = profile?.modelOverrides
    if (overrides && typeof overrides === 'object' && !Array.isArray(overrides)) {
      for (const [id, raw] of Object.entries(overrides)) {
        if (!models.has(id)) models.set(id, { id, name: typeof raw?.name === 'string' && raw.name ? raw.name : id })
      }
    }
    return [route, [...models.values()]]
  }))
  const rules = Array.isArray(section.value?.rules) ? section.value.rules.map(row => ({
    provider: String(row?.provider ?? ''),
    model: String(row?.model ?? ''),
    body: String(row?.body ?? ''),
  })) : []
  return { section, inventory, rules, writable: reply.value.writable !== false }
}

export function validateRules(rows) {
  const seen = new Set()
  return rows.map((row, index) => {
    const provider = row.provider.trim()
    const model = row.model.trim()
    if (!provider || !model) throw new Error(`第 ${index + 1} 条：请选择 provider 并填写模型 ID`)
    const key = JSON.stringify([provider, model])
    if (seen.has(key)) throw new Error(`第 ${index + 1} 条：同一个 provider 和模型已有规则`)
    seen.add(key)
    try { parseBody(row.body) }
    catch (error) { throw new Error(`第 ${index + 1} 条：${error.message}`) }
    return { provider, model, body: row.body.trim() }
  })
}

/** Group the live model inventory, retaining rules whose models disappeared. */
export function modelGroups(inventory, rules, query = '') {
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
