// src/index.ts
import { AsyncLocalStorage } from "node:async_hooks";
import z from "@deepseek-ai/schemastery";

// src/rules.ts
var unsafeKeys = /* @__PURE__ */ new Set(["__proto__", "prototype", "constructor"]);
var protectedFields = /* @__PURE__ */ new Set(["model", "messages", "stream"]);
function isObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function validKeys(value) {
  if (Array.isArray(value)) return value.every(validKeys);
  if (!isObject(value)) return true;
  return Object.entries(value).every(([key, child]) => !unsafeKeys.has(key) && validKeys(child));
}
function parseBody(body) {
  if (typeof body !== "string") throw new Error("body must be a JSON object string");
  const parsed = JSON.parse(body);
  if (!isObject(parsed) || !validKeys(parsed)) throw new Error("body must be a safe JSON object");
  for (const key of Object.keys(parsed)) {
    if (protectedFields.has(key)) throw new Error(`body cannot replace ${key}`);
  }
  return parsed;
}
function mergeObjects(target, patch) {
  const result = { ...target };
  for (const [key, value] of Object.entries(patch)) {
    result[key] = isObject(value) && isObject(result[key]) ? mergeObjects(result[key], value) : value;
  }
  return result;
}

// src/index.ts
var name = "dsh-extra-body";
var inject = ["settings", "llm"];
var ENTRY_ID = "extra-body";
var NAMESPACE = "dsh-extra-body";
var fields = {
  rules: z.array(z.object({
    provider: z.string().required(),
    model: z.string().required(),
    body: z.string().required()
  })).default([])
};
var Config = z.object(fields).default({ rules: [] }).volatile();
var legacyConfig = z.object(fields).default({ rules: [] });
function geminiModelFromUrl(url) {
  try {
    const parsed = new URL(url);
    const match = /\/models\/([^/:]+):(generateContent|streamGenerateContent)\/?$/.exec(parsed.pathname);
    return match?.[1] === void 0 ? void 0 : decodeURIComponent(match[1]);
  } catch {
    return void 0;
  }
}
async function patchRequest(input, init, rule) {
  const url = typeof input === "string" || input instanceof URL ? String(input) : input?.url;
  if (typeof url !== "string") return void 0;
  let protocol;
  try {
    protocol = new URL(url).protocol;
  } catch {
    return void 0;
  }
  if (protocol !== "http:" && protocol !== "https:") return void 0;
  const method = init?.method ?? (typeof Request !== "undefined" && input instanceof Request ? input.method : void 0);
  if (String(method ?? "GET").toUpperCase() !== "POST") return void 0;
  const headers = new Headers(typeof Request !== "undefined" && input instanceof Request ? input.headers : void 0);
  if (init?.headers !== void 0) new Headers(init.headers).forEach((value, header) => headers.set(header, value));
  const contentType = headers.get("content-type");
  if (contentType !== null && !/\bjson\b/i.test(contentType)) return void 0;
  const source = typeof init?.body === "string" ? init.body : typeof Request !== "undefined" && input instanceof Request && init?.body === void 0 ? await input.clone().text() : void 0;
  if (source === void 0) return void 0;
  let payload;
  try {
    payload = JSON.parse(source);
  } catch {
    return void 0;
  }
  if (!isObject(payload)) return void 0;
  const requestModel = typeof payload.model === "string" ? payload.model : geminiModelFromUrl(url);
  if (requestModel !== rule.model) return void 0;
  return { ...init, body: JSON.stringify(mergeObjects(payload, rule.body)) };
}
function bindStream(source, storage, rule) {
  return {
    [Symbol.asyncIterator]() {
      const iterator = source[Symbol.asyncIterator]();
      const activeRule = { ...rule, active: true };
      return {
        next(value) {
          return storage.run(activeRule, async () => {
            try {
              const result = await iterator.next(value);
              if (result.done) activeRule.active = false;
              return result;
            } catch (error) {
              activeRule.active = false;
              throw error;
            }
          });
        },
        return(value) {
          return storage.run(activeRule, async () => {
            try {
              return await (iterator.return?.(value) ?? { done: true, value });
            } finally {
              activeRule.active = false;
            }
          });
        },
        throw(error) {
          return storage.run(activeRule, async () => {
            try {
              return await (iterator.throw?.(error) ?? Promise.reject(error));
            } finally {
              activeRule.active = false;
            }
          });
        },
        [Symbol.asyncIterator]() {
          return this;
        }
      };
    }
  };
}
function settingsValue(settings, scope, entryId) {
  try {
    const value = scope !== void 0 ? scope.get() : (() => {
      const descriptors = settings.describe?.();
      if (!Array.isArray(descriptors)) return void 0;
      const descriptor = descriptors.find((item) => isObject(item) && item.ns === entryId);
      return isObject(descriptor) ? descriptor.value : void 0;
    })();
    return isObject(value) ? value : void 0;
  } catch {
    return void 0;
  }
}
function apply(ctx) {
  const settings = ctx.settings;
  const scope = typeof settings.register === "function" ? settings.register(NAMESPACE, legacyConfig, { applies: "live" }) : void 0;
  const entryId = ctx.fiber?.entry?.options?.id || ENTRY_ID;
  const storage = new AsyncLocalStorage();
  const invalidRules = /* @__PURE__ */ new Set();
  const unsubscribe = ctx.on("llm/stream", (options, next) => {
    if (typeof next !== "function") return void 0;
    const source = next();
    if (!isObject(options)) return source;
    const config = settingsValue(settings, scope, entryId);
    const rows = Array.isArray(config?.rules) ? config.rules : [];
    const row = rows.find((item) => isObject(item) && item.provider === options.provider && item.model === options.model);
    if (!isObject(row)) return source;
    try {
      const body = parseBody(row.body);
      return bindStream(source, storage, { model: String(row.model), body });
    } catch (error) {
      const identity = `${row.provider}/${row.model}:${row.body}`;
      if (!invalidRules.has(identity)) {
        invalidRules.add(identity);
        console.warn("[dsh-extra-body] invalid rule:", error);
      }
      return source;
    }
  });
  const previousFetch = globalThis.fetch;
  if (typeof previousFetch !== "function") {
    console.warn("[dsh-extra-body] fetch unavailable; request body injection disabled");
    ctx.effect(() => () => {
      if (typeof unsubscribe === "function") unsubscribe();
      storage.disable();
    }, "dsh-extra-body: request listener");
    return;
  }
  const wrappedFetch = async (input, init) => {
    const rule = storage.getStore();
    const patched = rule?.active === true ? await patchRequest(input, init, rule) : void 0;
    return previousFetch(input, patched ?? init);
  };
  globalThis.fetch = wrappedFetch;
  ctx.effect(() => () => {
    if (typeof unsubscribe === "function") unsubscribe();
    storage.disable();
    if (globalThis.fetch === wrappedFetch) globalThis.fetch = previousFetch;
  }, "dsh-extra-body: request JSON injection");
}
export {
  Config,
  apply,
  inject,
  name,
  parseBody,
  patchRequest
};
