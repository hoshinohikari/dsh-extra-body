import * as React from 'react'
import { parseBody } from './rules.js'
import { modelGroups, readSettings, settingsBridge, validateRules } from './client-core.js'
import { bodyError, LOCALE_DATA, LOCALE_NS } from './locales.js'
import type { Translation } from './locales.js'
import type { Inventory, InventoryModel, Rule, SettingsApi, SettingsSection } from './client-core.js'
import { palette } from './theme.js'
import type { Palette } from './theme.js'

export const name = 'dsh-extra-body-client'
export const inject = ['slots', 'connection', 'locale']

const h = React.createElement
const keyOf = (provider: string, model: string): string => JSON.stringify([provider, model])
const exampleBody = '{\n  "requesty": {\n    "auto_cache": true\n  }\n}'
const paths = {
  sliders: 'M4 7h16M4 17h16M9 4v6m6 4v6', layers: 'm12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5m-18 5 9 5 9-5',
  model: 'M5 5h14v14H5zM9 9h6v6H9z', search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm6-2 4 4',
  down: 'm6 9 6 6 6-6', up: 'm6 15 6-6 6 6', check: 'm4 12 5 5L20 6',
  refresh: 'M20 7v5h-5M4 17v-5h5M5 9a7 7 0 0 1 12-3l3 1M4 17l3 1a7 7 0 0 0 12-3',
  trash: 'M4 7h16M9 7V4h6v3m-9 0 1 13h10l1-13M10 11v6m4-6v6',
}
type IconName = keyof typeof paths
function Icon({ name, size = 16 }: { name: IconName; size?: number }): React.ReactElement {
  return h('svg', { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true }, h('path', { d: paths[name] }))
}
interface ButtonProps {
  colors: Palette
  icon?: IconName
  children?: React.ReactNode
  primary?: boolean
  danger?: boolean
  disabled?: boolean
  onClick?: () => void
}
function Button({ colors, icon, children, primary, danger, disabled, onClick }: ButtonProps): React.ReactElement {
  return h('button', { type: 'button', disabled, onClick, style: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 28,
    padding: '4px 10px', borderRadius: 7, border: `1px solid ${primary ? colors.accent : danger ? colors.dangerBorder : colors.border}`,
    backgroundColor: primary ? colors.accent : danger ? colors.dangerBg : colors.raised,
    color: primary ? '#fff' : danger ? colors.danger : colors.text, fontSize: 12, fontWeight: 650,
    cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1, boxShadow: primary ? 'none' : colors.shadow,
  } }, icon ? h(Icon, { name: icon, size: 14 }) : null, children)
}

function messageOf(error: unknown): string { return error instanceof Error ? error.message : String(error) }

interface ClientLocale {
  register(namespace: string, dictionaries: typeof LOCALE_DATA): () => void
  bind(namespace: string): Translation
  subscribe(listener: () => void): () => void
  getSnapshot(): { active?: string; revision?: number }
  setLocale(id: string): void
}

function Editor({ api, locale, t }: { api: SettingsApi; locale: ClientLocale; t: Translation }): React.ReactElement {
  const colors = palette()
  const subscribe = React.useCallback((listener: () => void) => locale.subscribe(listener), [locale])
  const getLocaleSnapshot = React.useCallback(() => locale.getSnapshot(), [locale])
  const localeSnapshot = React.useSyncExternalStore(subscribe, getLocaleSnapshot, getLocaleSnapshot)
  const language = localeSnapshot.active === 'zh' ? 'zh' : 'en'
  const [loading, setLoading] = React.useState(true)
  const [busyKey, setBusyKey] = React.useState('')
  const [error, setError] = React.useState('')
  const [notice, setNotice] = React.useState('')
  const [section, setSection] = React.useState<SettingsSection | null>(null)
  const [inventory, setInventory] = React.useState<Inventory>({})
  const [rules, setRules] = React.useState<Rule[]>([])
  const [drafts, setDrafts] = React.useState<Record<string, string>>({})
  const [query, setQuery] = React.useState('')
  const [openProviders, setOpenProviders] = React.useState<Record<string, boolean>>({})
  const [openModels, setOpenModels] = React.useState<Record<string, boolean>>({})
  const [writable, setWritable] = React.useState(true)

  const load = React.useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const snapshot = readSettings(await api.describe(), t)
      setSection(snapshot.section)
      setInventory(snapshot.inventory)
      setRules(snapshot.rules)
      setDrafts(Object.fromEntries(snapshot.rules.map(row => [keyOf(row.provider, row.model), row.body])))
      setWritable(snapshot.writable)
      const firstRoute = Object.keys(snapshot.inventory)[0]
      if (firstRoute) setOpenProviders(current => Object.keys(current).length ? current : { [firstRoute]: true })
    } catch (cause) { setError(messageOf(cause)) }
    finally { setLoading(false) }
  }, [api, t])
  React.useEffect(() => { void load() }, [load])

  const mutateRules = async (key: string, nextRules: Rule[], message: string): Promise<void> => {
    if (!section || !Number.isInteger(section.revision)) { setError(t('missingRevision')); return }
    setBusyKey(key); setError(''); setNotice('')
    try {
      const result = await api.mutate(section.ns, [{ op: 'set', path: ['rules'], value: validateRules(nextRules, t) }], section.revision)
      if (result?.ok !== true) throw new Error(result?.error?.message || t('saveFailed'))
      await load()
      setNotice(message)
    } catch (cause) { setError(messageOf(cause)) }
    finally { setBusyKey('') }
  }
  const saveModel = (provider: string, model: string, body: string): void => { void mutateRules(keyOf(provider, model), [
    ...rules.filter(row => row.provider !== provider || row.model !== model), { provider, model, body },
  ], t('modelSaved', { model })) }
  const removeModel = (provider: string, model: string): void => { void mutateRules(keyOf(provider, model),
    rules.filter(row => row.provider !== provider || row.model !== model), t('ruleRemoved', { model })) }

  const routes = [...new Set([...Object.keys(inventory), ...rules.map(row => row.provider)])]
  const search = query.trim().toLowerCase()
  const groups = modelGroups(inventory, rules, query)

  const muted: React.CSSProperties = { color: colors.secondary, fontSize: 12 }
  const field: React.CSSProperties = { boxSizing: 'border-box', width: '100%', border: `1px solid ${colors.border}`, borderRadius: 8, backgroundColor: colors.field, color: colors.text, outline: 'none', boxShadow: colors.shadow }
  const renderModel = (route: string, item: InventoryModel): React.ReactElement => {
    const key = keyOf(route, item.id)
    const rule = rules.find(row => row.provider === route && row.model === item.id)
    const body = drafts[key] ?? rule?.body ?? exampleBody
    const open = openModels[key] === true
    const dirty = rule ? body !== rule.body : body !== exampleBody
    let validationError = ''
    try { parseBody(body) } catch (cause) { validationError = bodyError(cause, t) }
    return h('div', { key, style: { marginTop: 4, overflow: 'hidden', border: `1px solid ${open ? colors.accent : dirty ? colors.accentBorder : colors.border}`, borderRadius: 8, backgroundColor: open ? colors.raised : colors.group, boxShadow: colors.shadow } },
      h('button', { type: 'button', onClick: () => setOpenModels(current => ({ ...current, [key]: !current[key] })), style: { display: 'flex', alignItems: 'center', gap: 8, boxSizing: 'border-box', width: '100%', minHeight: 42, padding: '5px 8px', border: 'none', background: 'transparent', color: colors.text, textAlign: 'left', cursor: 'pointer' } },
        h('span', { style: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, borderRadius: 7, backgroundColor: colors.field, color: colors.accent } }, h(Icon, { name: 'model', size: 14 })),
        h('span', { style: { display: 'grid', minWidth: 0, gap: 2 } }, h('strong', { style: { fontSize: 13, overflowWrap: 'anywhere' } }, item.id), item.name !== item.id ? h('small', { style: { ...muted, fontSize: 10 } }, item.name) : null),
        item.stale ? h('span', { style: { color: colors.danger, fontSize: 10 } }, t('missingModel')) : null,
        h('span', { style: { marginLeft: 'auto', padding: '2px 5px', borderRadius: 5, color: rule ? colors.accent : colors.secondary, backgroundColor: rule ? colors.accentSoft : 'transparent', fontSize: 10, whiteSpace: 'nowrap' } }, rule ? dirty ? t('unsaved') : t('configured') : t('unconfigured')),
        h('span', { style: { color: colors.accent } }, h(Icon, { name: open ? 'up' : 'down', size: 15 })),
      ),
      open ? h('div', { style: { padding: '10px 12px 12px', borderTop: `1px solid ${colors.divider}` } },
        h('label', { style: { display: 'grid', gap: 6, fontSize: 12, fontWeight: 650 } }, t('bodyLabel'),
          h('textarea', { value: body, rows: 7, spellCheck: false, onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => setDrafts(current => ({ ...current, [key]: event.target.value })), style: { ...field, minHeight: 130, padding: '9px 10px', resize: 'vertical', fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace', fontSize: 12, lineHeight: '18px' } })),
        h('p', { style: { margin: '6px 0 10px', color: validationError ? colors.danger : colors.secondary, fontSize: 11 } }, validationError || t('bodyHint')),
        h('div', { style: { display: 'flex', gap: 8, flexWrap: 'wrap' } },
          h(Button, { colors, icon: 'check', primary: true, disabled: !!busyKey || !writable || !!validationError || (!!rule && !dirty), onClick: () => saveModel(route, item.id, body) }, busyKey === key ? t('saving') : t('saveModel')),
          rule ? h(Button, { colors, icon: 'trash', danger: true, disabled: !!busyKey || !writable, onClick: () => removeModel(route, item.id) }, t('deleteRule')) : null,
          dirty ? h(Button, { colors, disabled: !!busyKey, onClick: () => setDrafts(current => ({ ...current, [key]: rule?.body ?? exampleBody })) }, t('discard')) : null,
        ),
      ) : null)
  }

  return h('div', { style: { position: 'relative', maxWidth: 920, margin: '0 auto', padding: '6px 8px 34px', color: colors.text, fontFamily: '-apple-system, BlinkMacSystemFont, SF Pro Text, Segoe UI, sans-serif' } },
    h('label', { style: { display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6, fontSize: 12, marginBottom: 4 } }, t('languageLabel'),
      h('select', { 'aria-label': t('languageLabel'), value: language, onChange: (event: React.ChangeEvent<HTMLSelectElement>) => { setError(''); setNotice(''); locale.setLocale(event.target.value) }, style: { height: 26, padding: '0 7px', border: `1px solid ${colors.border}`, borderRadius: 7, backgroundColor: colors.field, color: colors.text, fontSize: 12 } },
        h('option', { value: 'zh' }, t('chinese')),
        h('option', { value: 'en' }, t('english')))),
    h('h3', { style: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 18, lineHeight: '24px', fontWeight: 700, margin: '0 0 6px' } }, h(Icon, { name: 'sliders', size: 19 }), t('pageTitle'), notice ? h('span', { role: 'status', style: { marginLeft: 'auto', padding: '2px 7px', border: `1px solid ${colors.accentBorder}`, borderRadius: 6, backgroundColor: colors.accentSoft, color: colors.accent, fontSize: 11 } }, notice) : null),
    h('p', { style: { ...muted, margin: '0 0 12px', lineHeight: '18px' } }, t('pageDescription')),
    error ? h('div', { role: 'alert', style: { padding: '7px 9px', marginBottom: 9, border: `1px solid ${colors.dangerBorder}`, borderRadius: 8, backgroundColor: colors.dangerBg, color: colors.danger, fontSize: 12 } }, error) : null,
    h('div', { style: { position: 'relative', marginBottom: 8 } }, h('span', { style: { position: 'absolute', left: 10, top: 7, color: colors.secondary, pointerEvents: 'none' } }, h(Icon, { name: 'search', size: 15 })), h('input', { type: 'search', value: query, placeholder: t('searchPlaceholder'), onChange: (event: React.ChangeEvent<HTMLInputElement>) => setQuery(event.target.value), style: { ...field, height: 31, padding: '0 10px 0 32px', fontSize: 13 } })),
    ...(loading ? [h('p', { style: muted }, t('loading'))] : groups.length === 0 ? [h('div', { style: { ...muted, padding: 14, border: `1px solid ${colors.border}`, borderRadius: 8, backgroundColor: colors.group } }, routes.length === 0 ? t('noProviders') : t('noMatches'))] :
      groups.map(({ route, models, configured }) => {
        const open = search !== '' || openProviders[route] === true
        return h('section', { key: route, style: { marginBottom: 7 } },
          h('button', { type: 'button', onClick: () => setOpenProviders(current => ({ ...current, [route]: !current[route] })), style: { display: 'flex', alignItems: 'center', gap: 8, boxSizing: 'border-box', width: '100%', minHeight: 40, padding: '5px 8px', border: `1px solid ${colors.border}`, borderRadius: 8, backgroundColor: colors.raised, color: colors.text, textAlign: 'left', cursor: 'pointer' } },
            h('span', { style: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, border: `1px solid ${colors.border}`, borderRadius: 7, backgroundColor: colors.group, color: colors.secondary } }, h(Icon, { name: 'layers', size: 14 })),
            h('span', { style: { display: 'grid', gap: 1, minWidth: 0 } }, h('strong', { style: { fontSize: 12, overflowWrap: 'anywhere' } }, route), h('small', { style: { color: colors.accent, fontSize: 10 } }, t('provider'))),
            h('span', { style: { marginLeft: 'auto', color: colors.secondary, fontSize: 11, whiteSpace: 'nowrap' } }, t('modelCount', { count: models.length }), configured ? t('configuredCount', { count: configured }) : ''),
            h('span', { style: { color: colors.accent } }, h(Icon, { name: open ? 'up' : 'down', size: 15 }))),
          ...(open ? models.map(item => renderModel(route, item)) : []))
      })),
    h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 } }, h('span', { style: { ...muted, fontSize: 11 } }, t('savedRuleCount', { count: rules.length })), h(Button, { colors, icon: 'refresh', disabled: loading || !!busyKey, onClick: () => { setNotice(''); void load() } }, t('refresh'))))
}

interface ClientSlots {
  inject(name: string, callback: () => unknown): unknown
  register(descriptor: Record<string, unknown>, render: () => React.ReactElement): unknown
}
interface ClientContext {
  get(name: string): unknown
  on(event: string, callback: (service: unknown) => void): unknown
  effect(factory: () => () => void, label: string): unknown
}

export function apply(ctx: ClientContext): void {
  const slots = ctx.get('slots') as ClientSlots | undefined
  const locale = ctx.get('locale') as ClientLocale | undefined
  if (!slots || typeof slots.inject !== 'function' || typeof slots.register !== 'function' || !locale) return
  let mounted = false
  const mount = () => {
    if (mounted) return
    const api = settingsBridge(ctx.get('connection'), ctx.get('remote.settings'))
    if (!api) return
    mounted = true
    ctx.effect(() => locale.register(LOCALE_NS, LOCALE_DATA), 'dsh-extra-body: locale dictionaries')
    const t = locale.bind(LOCALE_NS)
    slots.inject('settings.section', () => slots.register({ name: 'settings.section', id: 'dsh-extra-body', order: 13, locale: LOCALE_NS, label: () => t('pageTitle') }, () => React.createElement(Editor, { api, locale, t })))
  }
  mount()
  ctx.on('internal/service', (service: unknown) => { if (service === 'remote.settings' || service === 'remote') mount() })
}
