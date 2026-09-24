window.__ModuleLoader__.load({ id: "dsh-extra-body", factory: (require) => {
var module = { exports: {} }; var exports = module.exports;
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name2 in all)
    __defProp(target, name2, { get: all[name2], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/client.ts
var client_exports = {};
__export(client_exports, {
  apply: () => apply,
  inject: () => inject,
  name: () => name
});
module.exports = __toCommonJS(client_exports);
var React = __toESM(require("react"), 1);

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

// src/locales.ts
var LOCALE_NS = "dsh-extra-body";
var zh = {
  pageTitle: "\u8BF7\u6C42\u9644\u52A0\u5B57\u6BB5",
  pageDescription: "\u4ECE\u73B0\u6709\u4F9B\u5E94\u5546\u4E0E\u6A21\u578B\u4E2D\u9009\u62E9\uFF0C\u5BF9\u8BE5\u6A21\u578B\u7684 JSON \u751F\u6210\u8BF7\u6C42\u5408\u5E76\u81EA\u5B9A\u4E49\u5B57\u6BB5\u3002",
  languageLabel: "\u9875\u9762\u8BED\u8A00",
  chinese: "\u4E2D\u6587",
  english: "English",
  searchPlaceholder: "\u641C\u7D22\u4F9B\u5E94\u5546\u6216\u6A21\u578B\uFF08\u540D\u79F0\u6216 ID\uFF09\u2026",
  loading: "\u6B63\u5728\u8BFB\u53D6\u4F9B\u5E94\u5546\u548C\u6A21\u578B\u2026",
  noProviders: "\u5C1A\u672A\u5728 llm-pi-ai \u4E2D\u627E\u5230\u4F9B\u5E94\u5546\u548C\u6A21\u578B\u3002",
  noMatches: "\u6CA1\u6709\u5339\u914D\u7684\u6A21\u578B\u3002",
  provider: "\u4F9B\u5E94\u5546",
  modelCount: "{count} \u4E2A\u6A21\u578B",
  configuredCount: " \xB7 {count} \u4E2A\u5DF2\u914D\u7F6E",
  missingModel: "\u6A21\u578B\u5DF2\u4E0D\u5728\u6E05\u5355\u4E2D",
  unsaved: "\u672A\u4FDD\u5B58",
  configured: "\u5DF2\u914D\u7F6E",
  unconfigured: "\u672A\u914D\u7F6E",
  bodyLabel: "\u8BF7\u6C42 JSON \u9644\u52A0\u5B57\u6BB5",
  bodyHint: '\u586B\u5199\u5B9E\u9645\u53D1\u9001\u7684 JSON \u5BF9\u8C61\uFF1B\u4F8B\u5982 {"requesty":{"auto_cache":true}}\uFF0C\u65E0\u9700 extra_body \u5305\u88C5\u3002',
  saving: "\u4FDD\u5B58\u4E2D\u2026",
  saveModel: "\u4FDD\u5B58\u6B64\u6A21\u578B",
  deleteRule: "\u5220\u9664\u89C4\u5219",
  discard: "\u653E\u5F03\u4FEE\u6539",
  savedRuleCount: "{count} \u6761\u5DF2\u4FDD\u5B58\u89C4\u5219",
  refresh: "\u5237\u65B0\u5217\u8868",
  modelSaved: "{model} \u5DF2\u4FDD\u5B58",
  ruleRemoved: "{model} \u7684\u9644\u52A0\u5B57\u6BB5\u5DF2\u79FB\u9664",
  missingRevision: "\u8BBE\u7F6E\u7248\u672C\u53F7\u4E0D\u53EF\u7528\uFF0C\u8BF7\u5237\u65B0\u540E\u91CD\u8BD5",
  saveFailed: "\u4FDD\u5B58\u5931\u8D25",
  readFailed: "\u65E0\u6CD5\u8BFB\u53D6 DSH \u8BBE\u7F6E",
  missingNamespaces: "DSH \u8BBE\u7F6E\u54CD\u5E94\u7F3A\u5C11\u5206\u533A\u5217\u8868",
  missingSection: "\u627E\u4E0D\u5230\u8BF7\u6C42\u9644\u52A0\u5B57\u6BB5\u8BBE\u7F6E\u5206\u533A\uFF0C\u8BF7\u786E\u8BA4\u5BBF\u4E3B\u63D2\u4EF6\u5DF2\u52A0\u8F7D",
  incompleteRule: "\u7B2C {index} \u6761\uFF1A\u8BF7\u9009\u62E9 provider \u5E76\u586B\u5199\u6A21\u578B ID",
  duplicateRule: "\u7B2C {index} \u6761\uFF1A\u540C\u4E00\u4E2A provider \u548C\u6A21\u578B\u5DF2\u6709\u89C4\u5219",
  ruleError: "\u7B2C {index} \u6761\uFF1A{message}",
  invalidJson: "\u8BF7\u8F93\u5165\u6709\u6548\u7684 JSON \u5BF9\u8C61",
  bodyMustObject: "\u8BF7\u6C42\u5B57\u6BB5\u5FC5\u987B\u662F\u5B89\u5168\u7684 JSON \u5BF9\u8C61",
  protectedField: "\u4E0D\u80FD\u8986\u76D6\u9876\u5C42 {field}"
};
var en = {
  pageTitle: "Extra Request Fields",
  pageDescription: "Choose an existing provider and model to merge custom fields into its JSON generation requests.",
  languageLabel: "Page language",
  chinese: "\u4E2D\u6587",
  english: "English",
  searchPlaceholder: "Search providers or models (name or ID)\u2026",
  loading: "Loading providers and models\u2026",
  noProviders: "No providers or models found in llm-pi-ai.",
  noMatches: "No matching models.",
  provider: "Provider",
  modelCount: "{count} models",
  configuredCount: " \xB7 {count} configured",
  missingModel: "Model no longer in the catalog",
  unsaved: "Unsaved",
  configured: "Configured",
  unconfigured: "Not configured",
  bodyLabel: "Extra request JSON fields",
  bodyHint: 'Enter the JSON object sent on the wire, for example {"requesty":{"auto_cache":true}}. Do not include an extra_body wrapper.',
  saving: "Saving\u2026",
  saveModel: "Save for this model",
  deleteRule: "Delete rule",
  discard: "Discard changes",
  savedRuleCount: "{count} saved rules",
  refresh: "Refresh list",
  modelSaved: "{model} saved",
  ruleRemoved: "Extra fields removed from {model}",
  missingRevision: "Settings revision unavailable. Refresh and try again.",
  saveFailed: "Save failed",
  readFailed: "Unable to read DSH settings",
  missingNamespaces: "DSH settings response has no sections",
  missingSection: "Extra Request Fields settings section not found. Check that the host plugin loaded.",
  incompleteRule: "Rule {index}: choose a provider and enter a model ID",
  duplicateRule: "Rule {index}: this provider and model already have a rule",
  ruleError: "Rule {index}: {message}",
  invalidJson: "Enter a valid JSON object",
  bodyMustObject: "Request fields must be a safe JSON object",
  protectedField: "Cannot replace top-level {field}"
};
var LOCALE_DATA = { zh, en };
function textFor(locale, key, params) {
  const template = LOCALE_DATA[locale][key];
  return params ? template.replace(/\{(\w+)\}/g, (match, name2) => name2 in params ? String(params[name2]) : match) : template;
}
function bodyError(error, t) {
  if (error instanceof SyntaxError) return t("invalidJson");
  const message = error instanceof Error ? error.message : String(error);
  const protectedMatch = /^body cannot replace (.+)$/.exec(message);
  if (protectedMatch) return t("protectedField", { field: protectedMatch[1] });
  return t("bodyMustObject");
}

// src/client-core.ts
var defaultTranslation = (key, params) => textFor("zh", key, params);
function unwrap(response) {
  const result = isObject(response) && isObject(response.result) ? response.result : response;
  return result;
}
function settingsBridge(connection, remoteSettings) {
  const connectionRecord = isObject(connection) ? connection : void 0;
  const api = isObject(connectionRecord?.api) ? connectionRecord.api : void 0;
  const legacy = isObject(api?.settings) ? api.settings : void 0;
  if (typeof legacy?.describe === "function" && typeof legacy.mutate === "function") {
    const describe = legacy.describe;
    const mutate = legacy.mutate;
    return {
      describe: async () => unwrap(await describe.call(legacy, {})),
      mutate: async (ns, ops, revision) => unwrap(await mutate.call(legacy, { ns, ops, expectedRevision: revision }))
    };
  }
  const modern = isObject(remoteSettings) ? remoteSettings : void 0;
  if (typeof modern?.describe === "function" && typeof modern.mutate === "function") {
    const describe = modern.describe;
    const mutate = modern.mutate;
    return {
      describe: async () => unwrap(await describe.call(modern)),
      mutate: async (ns, ops, revision) => unwrap(await mutate.call(modern, ns, ops, revision))
    };
  }
  return void 0;
}
function readSettings(reply, t = defaultTranslation) {
  if (reply?.ok !== true) throw new Error(reply?.error?.message || t("readFailed"));
  const value = isObject(reply.value) ? reply.value : void 0;
  const namespaces = value?.namespaces;
  if (!Array.isArray(namespaces)) throw new Error(t("missingNamespaces"));
  const sectionRaw = namespaces.find((item) => isObject(item) && (item.ns === "extra-body" || item.ns === "dsh-extra-body"));
  if (!isObject(sectionRaw) || typeof sectionRaw.ns !== "string") throw new Error(t("missingSection"));
  const section = {
    ns: sectionRaw.ns,
    revision: typeof sectionRaw.revision === "number" ? sectionRaw.revision : NaN,
    value: isObject(sectionRaw.value) ? sectionRaw.value : void 0
  };
  const piAi = namespaces.find((item) => isObject(item) && item.ns === "llm-pi-ai");
  const providerValue = isObject(piAi) && isObject(piAi.value) ? piAi.value.providers : void 0;
  const providers = isObject(providerValue) ? providerValue : {};
  const inventory = Object.fromEntries(Object.entries(providers).map(([route, rawProfile]) => {
    const profile = isObject(rawProfile) ? rawProfile : void 0;
    const models = /* @__PURE__ */ new Map();
    if (Array.isArray(profile?.models)) {
      for (const entry of profile.models) {
        const raw = isObject(entry) ? entry : void 0;
        if (typeof raw?.id !== "string" || raw.id.length === 0) continue;
        models.set(raw.id, { id: raw.id, name: typeof raw.name === "string" && raw.name ? raw.name : raw.id });
      }
    }
    const overrides = isObject(profile?.modelOverrides) ? profile.modelOverrides : void 0;
    if (overrides) {
      for (const [id, entry] of Object.entries(overrides)) {
        const raw = isObject(entry) ? entry : void 0;
        if (!models.has(id)) models.set(id, { id, name: typeof raw?.name === "string" && raw.name ? raw.name : id });
      }
    }
    return [route, [...models.values()]];
  }));
  const rawRules = section.value?.rules;
  const rules = Array.isArray(rawRules) ? rawRules.map((row) => {
    const raw = isObject(row) ? row : void 0;
    return { provider: String(raw?.provider ?? ""), model: String(raw?.model ?? ""), body: String(raw?.body ?? "") };
  }) : [];
  return { section, inventory, rules, writable: value?.writable !== false };
}
function validateRules(rows, t = defaultTranslation) {
  const seen = /* @__PURE__ */ new Set();
  return rows.map((row, index) => {
    const provider = row.provider.trim();
    const model = row.model.trim();
    if (!provider || !model) throw new Error(t("incompleteRule", { index: index + 1 }));
    const key = JSON.stringify([provider, model]);
    if (seen.has(key)) throw new Error(t("duplicateRule", { index: index + 1 }));
    seen.add(key);
    try {
      parseBody(row.body);
    } catch (error) {
      throw new Error(t("ruleError", { index: index + 1, message: bodyError(error, t) }));
    }
    return { provider, model, body: row.body.trim() };
  });
}
function modelGroups(inventory, rules, query = "") {
  const routes = [.../* @__PURE__ */ new Set([...Object.keys(inventory), ...rules.map((row) => row.provider)])];
  const search = query.trim().toLowerCase();
  return routes.map((route) => {
    const listed = inventory[route] ?? [];
    const known = new Set(listed.map((item) => item.id));
    const stale = rules.filter((row) => row.provider === route && !known.has(row.model)).map((row) => ({ id: row.model, name: row.model, stale: true }));
    const models = [...listed, ...stale].filter((item) => !search || route.toLowerCase().includes(search) || item.id.toLowerCase().includes(search) || item.name.toLowerCase().includes(search));
    return { route, models, configured: rules.filter((row) => row.provider === route).length };
  }).filter((group) => group.models.length);
}

// src/theme.ts
function colorParts(color) {
  const values = typeof color === "string" ? color.match(/\d+(?:\.\d+)?/g)?.map(Number) : void 0;
  return values !== void 0 && values.length >= 3 ? values : void 0;
}
function luminance(values) {
  return values[0] * 0.2126 + values[1] * 0.7152 + values[2] * 0.0722;
}
function isDarkTheme({ bodyBackground, rootBackground, textColor, prefersDark } = {}) {
  for (const color of [bodyBackground, rootBackground]) {
    const values = colorParts(color);
    if (values && (values[3] ?? 1) > 0) return luminance(values) < 145;
  }
  const text = colorParts(textColor);
  if (text && (text[3] ?? 1) > 0) return luminance(text) > 145;
  return prefersDark === true;
}
function palette(environment) {
  let dark = false;
  if (environment !== void 0) dark = isDarkTheme(environment);
  else {
    try {
      const body = getComputedStyle(document.body);
      const root = getComputedStyle(document.documentElement);
      dark = isDarkTheme({
        bodyBackground: body.backgroundColor,
        rootBackground: root.backgroundColor,
        textColor: body.color,
        prefersDark: window.matchMedia?.("(prefers-color-scheme: dark)").matches
      });
    } catch {
    }
  }
  return dark ? {
    group: "#2C2C2E",
    raised: "#3A3A3C",
    field: "#2C2C2E",
    border: "rgba(255,255,255,0.12)",
    divider: "rgba(255,255,255,0.10)",
    text: "#F5F5F7",
    secondary: "rgba(235,235,245,0.60)",
    accent: "#0A84FF",
    accentSoft: "rgba(10,132,255,0.16)",
    accentBorder: "rgba(10,132,255,0.42)",
    danger: "#FF453A",
    dangerBg: "rgba(255,69,58,0.16)",
    dangerBorder: "rgba(255,69,58,0.30)",
    shadow: "0 1px 1px rgba(0,0,0,0.24)"
  } : {
    group: "#FFFFFF",
    raised: "#F9F9FB",
    field: "#F2F2F7",
    border: "rgba(60,60,67,0.18)",
    divider: "rgba(60,60,67,0.18)",
    text: "#1C1C1E",
    secondary: "#6D6D72",
    accent: "#007AFF",
    accentSoft: "rgba(0,122,255,0.10)",
    accentBorder: "rgba(0,122,255,0.32)",
    danger: "#FF3B30",
    dangerBg: "rgba(255,59,48,0.12)",
    dangerBorder: "rgba(255,59,48,0.28)",
    shadow: "0 1px 1px rgba(0,0,0,0.05)"
  };
}

// src/client.ts
var name = "dsh-extra-body-client";
var inject = ["slots", "connection", "locale"];
var h = React.createElement;
var keyOf = (provider, model) => JSON.stringify([provider, model]);
var exampleBody = '{\n  "requesty": {\n    "auto_cache": true\n  }\n}';
var paths = {
  sliders: "M4 7h16M4 17h16M9 4v6m6 4v6",
  layers: "m12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5m-18 5 9 5 9-5",
  model: "M5 5h14v14H5zM9 9h6v6H9z",
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm6-2 4 4",
  down: "m6 9 6 6 6-6",
  up: "m6 15 6-6 6 6",
  check: "m4 12 5 5L20 6",
  refresh: "M20 7v5h-5M4 17v-5h5M5 9a7 7 0 0 1 12-3l3 1M4 17l3 1a7 7 0 0 0 12-3",
  trash: "M4 7h16M9 7V4h6v3m-9 0 1 13h10l1-13M10 11v6m4-6v6"
};
function Icon({ name: name2, size = 16 }) {
  return h("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true }, h("path", { d: paths[name2] }));
}
function Button({ colors, icon, children, primary, danger, disabled, onClick }) {
  return h("button", { type: "button", disabled, onClick, style: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    minHeight: 28,
    padding: "4px 10px",
    borderRadius: 7,
    border: `1px solid ${primary ? colors.accent : danger ? colors.dangerBorder : colors.border}`,
    backgroundColor: primary ? colors.accent : danger ? colors.dangerBg : colors.raised,
    color: primary ? "#fff" : danger ? colors.danger : colors.text,
    fontSize: 12,
    fontWeight: 650,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
    boxShadow: primary ? "none" : colors.shadow
  } }, icon ? h(Icon, { name: icon, size: 14 }) : null, children);
}
function messageOf(error) {
  return error instanceof Error ? error.message : String(error);
}
function Editor({ api, locale, t }) {
  const colors = palette();
  const subscribe = React.useCallback((listener) => locale.subscribe(listener), [locale]);
  const getLocaleSnapshot = React.useCallback(() => locale.getSnapshot(), [locale]);
  const localeSnapshot = React.useSyncExternalStore(subscribe, getLocaleSnapshot, getLocaleSnapshot);
  const language = localeSnapshot.active === "zh" ? "zh" : "en";
  const [loading, setLoading] = React.useState(true);
  const [busyKey, setBusyKey] = React.useState("");
  const [error, setError] = React.useState("");
  const [notice, setNotice] = React.useState("");
  const [section, setSection] = React.useState(null);
  const [inventory, setInventory] = React.useState({});
  const [rules, setRules] = React.useState([]);
  const [drafts, setDrafts] = React.useState({});
  const [query, setQuery] = React.useState("");
  const [openProviders, setOpenProviders] = React.useState({});
  const [openModels, setOpenModels] = React.useState({});
  const [writable, setWritable] = React.useState(true);
  const load = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const snapshot = readSettings(await api.describe(), t);
      setSection(snapshot.section);
      setInventory(snapshot.inventory);
      setRules(snapshot.rules);
      setDrafts(Object.fromEntries(snapshot.rules.map((row) => [keyOf(row.provider, row.model), row.body])));
      setWritable(snapshot.writable);
      const firstRoute = Object.keys(snapshot.inventory)[0];
      if (firstRoute) setOpenProviders((current) => Object.keys(current).length ? current : { [firstRoute]: true });
    } catch (cause) {
      setError(messageOf(cause));
    } finally {
      setLoading(false);
    }
  }, [api, t]);
  React.useEffect(() => {
    void load();
  }, [load]);
  const mutateRules = async (key, nextRules, message) => {
    if (!section || !Number.isInteger(section.revision)) {
      setError(t("missingRevision"));
      return;
    }
    setBusyKey(key);
    setError("");
    setNotice("");
    try {
      const result = await api.mutate(section.ns, [{ op: "set", path: ["rules"], value: validateRules(nextRules, t) }], section.revision);
      if (result?.ok !== true) throw new Error(result?.error?.message || t("saveFailed"));
      await load();
      setNotice(message);
    } catch (cause) {
      setError(messageOf(cause));
    } finally {
      setBusyKey("");
    }
  };
  const saveModel = (provider, model, body) => {
    void mutateRules(keyOf(provider, model), [
      ...rules.filter((row) => row.provider !== provider || row.model !== model),
      { provider, model, body }
    ], t("modelSaved", { model }));
  };
  const removeModel = (provider, model) => {
    void mutateRules(
      keyOf(provider, model),
      rules.filter((row) => row.provider !== provider || row.model !== model),
      t("ruleRemoved", { model })
    );
  };
  const routes = [.../* @__PURE__ */ new Set([...Object.keys(inventory), ...rules.map((row) => row.provider)])];
  const search = query.trim().toLowerCase();
  const groups = modelGroups(inventory, rules, query);
  const muted = { color: colors.secondary, fontSize: 12 };
  const field = { boxSizing: "border-box", width: "100%", border: `1px solid ${colors.border}`, borderRadius: 8, backgroundColor: colors.field, color: colors.text, outline: "none", boxShadow: colors.shadow };
  const renderModel = (route, item) => {
    const key = keyOf(route, item.id);
    const rule = rules.find((row) => row.provider === route && row.model === item.id);
    const body = drafts[key] ?? rule?.body ?? exampleBody;
    const open = openModels[key] === true;
    const dirty = rule ? body !== rule.body : body !== exampleBody;
    let validationError = "";
    try {
      parseBody(body);
    } catch (cause) {
      validationError = bodyError(cause, t);
    }
    return h(
      "div",
      { key, style: { marginTop: 4, overflow: "hidden", border: `1px solid ${open ? colors.accent : dirty ? colors.accentBorder : colors.border}`, borderRadius: 8, backgroundColor: open ? colors.raised : colors.group, boxShadow: colors.shadow } },
      h(
        "button",
        { type: "button", onClick: () => setOpenModels((current) => ({ ...current, [key]: !current[key] })), style: { display: "flex", alignItems: "center", gap: 8, boxSizing: "border-box", width: "100%", minHeight: 42, padding: "5px 8px", border: "none", background: "transparent", color: colors.text, textAlign: "left", cursor: "pointer" } },
        h("span", { style: { display: "inline-flex", alignItems: "center", justifyContent: "center", width: 24, height: 24, borderRadius: 7, backgroundColor: colors.field, color: colors.accent } }, h(Icon, { name: "model", size: 14 })),
        h("span", { style: { display: "grid", minWidth: 0, gap: 2 } }, h("strong", { style: { fontSize: 13, overflowWrap: "anywhere" } }, item.id), item.name !== item.id ? h("small", { style: { ...muted, fontSize: 10 } }, item.name) : null),
        item.stale ? h("span", { style: { color: colors.danger, fontSize: 10 } }, t("missingModel")) : null,
        h("span", { style: { marginLeft: "auto", padding: "2px 5px", borderRadius: 5, color: rule ? colors.accent : colors.secondary, backgroundColor: rule ? colors.accentSoft : "transparent", fontSize: 10, whiteSpace: "nowrap" } }, rule ? dirty ? t("unsaved") : t("configured") : t("unconfigured")),
        h("span", { style: { color: colors.accent } }, h(Icon, { name: open ? "up" : "down", size: 15 }))
      ),
      open ? h(
        "div",
        { style: { padding: "10px 12px 12px", borderTop: `1px solid ${colors.divider}` } },
        h(
          "label",
          { style: { display: "grid", gap: 6, fontSize: 12, fontWeight: 650 } },
          t("bodyLabel"),
          h("textarea", { value: body, rows: 7, spellCheck: false, onChange: (event) => setDrafts((current) => ({ ...current, [key]: event.target.value })), style: { ...field, minHeight: 130, padding: "9px 10px", resize: "vertical", fontFamily: "ui-monospace, SFMono-Regular, Consolas, monospace", fontSize: 12, lineHeight: "18px" } })
        ),
        h("p", { style: { margin: "6px 0 10px", color: validationError ? colors.danger : colors.secondary, fontSize: 11 } }, validationError || t("bodyHint")),
        h(
          "div",
          { style: { display: "flex", gap: 8, flexWrap: "wrap" } },
          h(Button, { colors, icon: "check", primary: true, disabled: !!busyKey || !writable || !!validationError || !!rule && !dirty, onClick: () => saveModel(route, item.id, body) }, busyKey === key ? t("saving") : t("saveModel")),
          rule ? h(Button, { colors, icon: "trash", danger: true, disabled: !!busyKey || !writable, onClick: () => removeModel(route, item.id) }, t("deleteRule")) : null,
          dirty ? h(Button, { colors, disabled: !!busyKey, onClick: () => setDrafts((current) => ({ ...current, [key]: rule?.body ?? exampleBody })) }, t("discard")) : null
        )
      ) : null
    );
  };
  return h(
    "div",
    { style: { position: "relative", maxWidth: 920, margin: "0 auto", padding: "6px 8px 34px", color: colors.text, fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, Segoe UI, sans-serif" } },
    h(
      "label",
      { style: { display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 6, fontSize: 12, marginBottom: 4 } },
      t("languageLabel"),
      h(
        "select",
        { "aria-label": t("languageLabel"), value: language, onChange: (event) => {
          setError("");
          setNotice("");
          locale.setLocale(event.target.value);
        }, style: { height: 26, padding: "0 7px", border: `1px solid ${colors.border}`, borderRadius: 7, backgroundColor: colors.field, color: colors.text, fontSize: 12 } },
        h("option", { value: "zh" }, t("chinese")),
        h("option", { value: "en" }, t("english"))
      )
    ),
    h("h3", { style: { display: "flex", alignItems: "center", gap: 8, fontSize: 18, lineHeight: "24px", fontWeight: 700, margin: "0 0 6px" } }, h(Icon, { name: "sliders", size: 19 }), t("pageTitle"), notice ? h("span", { role: "status", style: { marginLeft: "auto", padding: "2px 7px", border: `1px solid ${colors.accentBorder}`, borderRadius: 6, backgroundColor: colors.accentSoft, color: colors.accent, fontSize: 11 } }, notice) : null),
    h("p", { style: { ...muted, margin: "0 0 12px", lineHeight: "18px" } }, t("pageDescription")),
    error ? h("div", { role: "alert", style: { padding: "7px 9px", marginBottom: 9, border: `1px solid ${colors.dangerBorder}`, borderRadius: 8, backgroundColor: colors.dangerBg, color: colors.danger, fontSize: 12 } }, error) : null,
    h("div", { style: { position: "relative", marginBottom: 8 } }, h("span", { style: { position: "absolute", left: 10, top: 7, color: colors.secondary, pointerEvents: "none" } }, h(Icon, { name: "search", size: 15 })), h("input", { type: "search", value: query, placeholder: t("searchPlaceholder"), onChange: (event) => setQuery(event.target.value), style: { ...field, height: 31, padding: "0 10px 0 32px", fontSize: 13 } })),
    ...loading ? [h("p", { style: muted }, t("loading"))] : groups.length === 0 ? [h("div", { style: { ...muted, padding: 14, border: `1px solid ${colors.border}`, borderRadius: 8, backgroundColor: colors.group } }, routes.length === 0 ? t("noProviders") : t("noMatches"))] : groups.map(({ route, models, configured }) => {
      const open = search !== "" || openProviders[route] === true;
      return h(
        "section",
        { key: route, style: { marginBottom: 7 } },
        h(
          "button",
          { type: "button", onClick: () => setOpenProviders((current) => ({ ...current, [route]: !current[route] })), style: { display: "flex", alignItems: "center", gap: 8, boxSizing: "border-box", width: "100%", minHeight: 40, padding: "5px 8px", border: `1px solid ${colors.border}`, borderRadius: 8, backgroundColor: colors.raised, color: colors.text, textAlign: "left", cursor: "pointer" } },
          h("span", { style: { display: "inline-flex", alignItems: "center", justifyContent: "center", width: 24, height: 24, border: `1px solid ${colors.border}`, borderRadius: 7, backgroundColor: colors.group, color: colors.secondary } }, h(Icon, { name: "layers", size: 14 })),
          h("span", { style: { display: "grid", gap: 1, minWidth: 0 } }, h("strong", { style: { fontSize: 12, overflowWrap: "anywhere" } }, route), h("small", { style: { color: colors.accent, fontSize: 10 } }, t("provider"))),
          h("span", { style: { marginLeft: "auto", color: colors.secondary, fontSize: 11, whiteSpace: "nowrap" } }, t("modelCount", { count: models.length }), configured ? t("configuredCount", { count: configured }) : ""),
          h("span", { style: { color: colors.accent } }, h(Icon, { name: open ? "up" : "down", size: 15 }))
        ),
        ...open ? models.map((item) => renderModel(route, item)) : []
      );
    }),
    h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 } }, h("span", { style: { ...muted, fontSize: 11 } }, t("savedRuleCount", { count: rules.length })), h(Button, { colors, icon: "refresh", disabled: loading || !!busyKey, onClick: () => {
      setNotice("");
      void load();
    } }, t("refresh")))
  );
}
function apply(ctx) {
  const slots = ctx.get("slots");
  const locale = ctx.get("locale");
  if (!slots || typeof slots.inject !== "function" || typeof slots.register !== "function" || !locale) return;
  let mounted = false;
  const mount = () => {
    if (mounted) return;
    const api = settingsBridge(ctx.get("connection"), ctx.get("remote.settings"));
    if (!api) return;
    mounted = true;
    ctx.effect(() => locale.register(LOCALE_NS, LOCALE_DATA), "dsh-extra-body: locale dictionaries");
    const t = locale.bind(LOCALE_NS);
    slots.inject("settings.section", () => slots.register({ name: "settings.section", id: "dsh-extra-body", order: 13, locale: LOCALE_NS, label: () => t("pageTitle") }, () => React.createElement(Editor, { api, locale, t })));
  };
  mount();
  ctx.on("internal/service", (service) => {
    if (service === "remote.settings" || service === "remote") mount();
  });
}
return module.exports; } });
