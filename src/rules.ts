const unsafeKeys = new Set(['__proto__', 'prototype', 'constructor'])
const protectedFields = new Set(['model', 'messages', 'stream'])

export type JsonValue = string | number | boolean | null | JsonValue[] | JsonObject
export interface JsonObject { [key: string]: JsonValue }

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function validKeys(value: unknown): boolean {
  if (Array.isArray(value)) return value.every(validKeys)
  if (!isObject(value)) return true
  return Object.entries(value).every(([key, child]) => !unsafeKeys.has(key) && validKeys(child))
}

/** Parse one rule's JSON. A rule may add fields, but cannot replace core request fields. */
export function parseBody(body: unknown): JsonObject {
  if (typeof body !== 'string') throw new Error('body must be a JSON object string')
  const parsed = JSON.parse(body)
  if (!isObject(parsed) || !validKeys(parsed)) throw new Error('body must be a safe JSON object')
  for (const key of Object.keys(parsed)) {
    if (protectedFields.has(key)) throw new Error(`body cannot replace ${key}`)
  }
  return parsed as JsonObject
}

export function mergeObjects(target: Record<string, unknown>, patch: JsonObject): Record<string, unknown> {
  const result: Record<string, unknown> = { ...target }
  for (const [key, value] of Object.entries(patch)) {
    result[key] = isObject(value) && isObject(result[key])
      ? mergeObjects(result[key], value as JsonObject)
      : value
  }
  return result
}
