export const LOCALE_NS = 'dsh-extra-body'

const zh = {
  pageTitle: '请求附加字段',
  pageDescription: '从现有供应商与模型中选择，对该模型的 JSON 生成请求合并自定义字段。',
  languageLabel: '页面语言',
  chinese: '中文',
  english: 'English',
  searchPlaceholder: '搜索供应商或模型（名称或 ID）…',
  loading: '正在读取供应商和模型…',
  noProviders: '尚未在 llm-pi-ai 中找到供应商和模型。',
  noMatches: '没有匹配的模型。',
  provider: '供应商',
  modelCount: '{count} 个模型',
  configuredCount: ' · {count} 个已配置',
  missingModel: '模型已不在清单中',
  unsaved: '未保存',
  configured: '已配置',
  unconfigured: '未配置',
  bodyLabel: '请求 JSON 附加字段',
  bodyHint: '填写实际发送的 JSON 对象；例如 {"requesty":{"auto_cache":true}}，无需 extra_body 包装。',
  saving: '保存中…',
  saveModel: '保存此模型',
  deleteRule: '删除规则',
  discard: '放弃修改',
  savedRuleCount: '{count} 条已保存规则',
  refresh: '刷新列表',
  modelSaved: '{model} 已保存',
  ruleRemoved: '{model} 的附加字段已移除',
  missingRevision: '设置版本号不可用，请刷新后重试',
  saveFailed: '保存失败',
  readFailed: '无法读取 DSH 设置',
  missingNamespaces: 'DSH 设置响应缺少分区列表',
  missingSection: '找不到请求附加字段设置分区，请确认宿主插件已加载',
  incompleteRule: '第 {index} 条：请选择 provider 并填写模型 ID',
  duplicateRule: '第 {index} 条：同一个 provider 和模型已有规则',
  ruleError: '第 {index} 条：{message}',
  invalidJson: '请输入有效的 JSON 对象',
  bodyMustObject: '请求字段必须是安全的 JSON 对象',
  protectedField: '不能覆盖顶层 {field}',
} as const

type TranslationKey = keyof typeof zh
const en: Record<TranslationKey, string> = {
  pageTitle: 'Extra Request Fields',
  pageDescription: 'Choose an existing provider and model to merge custom fields into its JSON generation requests.',
  languageLabel: 'Page language',
  chinese: '中文',
  english: 'English',
  searchPlaceholder: 'Search providers or models (name or ID)…',
  loading: 'Loading providers and models…',
  noProviders: 'No providers or models found in llm-pi-ai.',
  noMatches: 'No matching models.',
  provider: 'Provider',
  modelCount: '{count} models',
  configuredCount: ' · {count} configured',
  missingModel: 'Model no longer in the catalog',
  unsaved: 'Unsaved',
  configured: 'Configured',
  unconfigured: 'Not configured',
  bodyLabel: 'Extra request JSON fields',
  bodyHint: 'Enter the JSON object sent on the wire, for example {"requesty":{"auto_cache":true}}. Do not include an extra_body wrapper.',
  saving: 'Saving…',
  saveModel: 'Save for this model',
  deleteRule: 'Delete rule',
  discard: 'Discard changes',
  savedRuleCount: '{count} saved rules',
  refresh: 'Refresh list',
  modelSaved: '{model} saved',
  ruleRemoved: 'Extra fields removed from {model}',
  missingRevision: 'Settings revision unavailable. Refresh and try again.',
  saveFailed: 'Save failed',
  readFailed: 'Unable to read DSH settings',
  missingNamespaces: 'DSH settings response has no sections',
  missingSection: 'Extra Request Fields settings section not found. Check that the host plugin loaded.',
  incompleteRule: 'Rule {index}: choose a provider and enter a model ID',
  duplicateRule: 'Rule {index}: this provider and model already have a rule',
  ruleError: 'Rule {index}: {message}',
  invalidJson: 'Enter a valid JSON object',
  bodyMustObject: 'Request fields must be a safe JSON object',
  protectedField: 'Cannot replace top-level {field}',
}

export const LOCALE_DATA = { zh, en }
export type LocaleCode = keyof typeof LOCALE_DATA
export type MessageKey = TranslationKey
export type Translation = (key: MessageKey, params?: Record<string, string | number>) => string

export function textFor(locale: LocaleCode, key: MessageKey, params?: Record<string, string | number>): string {
  const template = LOCALE_DATA[locale][key]
  return params ? template.replace(/\{(\w+)\}/g, (match, name: string) => name in params ? String(params[name]) : match) : template
}

export function bodyError(error: unknown, t: Translation): string {
  if (error instanceof SyntaxError) return t('invalidJson')
  const message = error instanceof Error ? error.message : String(error)
  const protectedMatch = /^body cannot replace (.+)$/.exec(message)
  if (protectedMatch) return t('protectedField', { field: protectedMatch[1]! })
  return t('bodyMustObject')
}
