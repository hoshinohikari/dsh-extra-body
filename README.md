# dsh-extra-body

Add custom JSON fields to requests for a specific [DSH (DeepSeek Harness)](https://github.com/deepseek-ai/deepseek-harness) `llm-pi-ai` provider and model. Configure the rule in DSH Desktop; subsequent matching requests use it without changing the model's capability declaration.

[![License: MIT](https://img.shields.io/github/license/hoshinohikari/dsh-extra-body)](./LICENSE)

- [中文 README](./README.zh.md)

> **Compatibility boundary:** The plugin modifies HTTP(S) `POST` JSON requests made with the process's global `fetch` during a matching DSH `llm/stream` call. The outgoing JSON must have a top-level `model` equal to the configured model ID. The endpoint must accept the extra fields you choose. WebSocket traffic, non-JSON bodies, and transports that bypass global `fetch` are not covered.

## Why use it?

Some OpenAI-compatible gateways accept request fields that DSH's standard model configuration does not declare. For example, Requesty documents a `requesty.auto_cache` field. This plugin attaches such fields to one provider/model pair without changing other models or editing DSH itself.

## Identifiers

| Purpose | Identifier |
| --- | --- |
| Package and Cordis plugin | `dsh-extra-body` |
| Loader entry | `extra-body` |
| Settings section on namespace-based DSH | `dsh-extra-body` |
| Settings section on entry-config DSH | `extra-body` |

## Features

- Discover providers and models from the existing `llm-pi-ai` settings section. Search by provider, model name, or model ID, then expand a model to edit its rule.
- Switch the Desktop page between Chinese and English using DSH's shared language setting; the sidebar title, editor, and validation messages follow the selection.
- Match an exact DSH provider route and model ID. A matching JSON request may use Chat Completions, Responses, Messages, or another model endpoint; the URL path is not fixed.
- Recursively merge object fields into the outgoing JSON. Arrays and scalar values at the same key are replaced.
- Validate JSON in the Desktop editor. Keep configured rules visible if their model later disappears from the inventory.
- Read settings through either the older `connection.api.settings` RPC or the newer `remote.settings` service.

## Install, upgrade, and remove

Use the official `dsh plugin` command for the profile you run in DSH Desktop. The repository includes the built host and client bundles, so installation from GitHub does not require a local TypeScript build.

```sh
# Install
dsh plugin --profile <profile> add github:hoshinohikari/dsh-extra-body

# Upgrade an existing GitHub installation
dsh plugin --profile <profile> update dsh-extra-body

# Remove
dsh plugin --profile <profile> remove dsh-extra-body
```

Restart DSH Desktop after installing or upgrading. Open **Settings → 请求附加字段** to configure a model.

## Quick use

1. Configure the target provider and model in DSH's **Models** settings.
2. Open **Settings → 请求附加字段**, expand the provider and model, and enter a JSON object.
3. Save the rule and make a model request. Inspect your gateway's request log to confirm the field arrived.

For Requesty automatic caching, enter this JSON in the model editor:

```json
{
  "requesty": {
    "auto_cache": true
  }
}
```

The equivalent stored rule is:

```yaml
rules:
  - provider: requesty
    model: anthropic/claude-opus-5
    body: '{"requesty":{"auto_cache":true}}'
```

Use the provider route and model ID from **your** DSH configuration. `extra_body` is a Python SDK argument, not a key to include in the outgoing JSON. The JSON sent to Requesty contains `requesty` at the top level.

## How it works

The host registers a settings section on namespace-based DSH; on entry-config DSH, its exported `Config` supplies the section. The Desktop page reads that section and the existing `llm-pi-ai` model inventory. Saves write the plugin's own `rules` array with a settings revision check.

For each `llm/stream` call, the host selects the first rule whose provider and model exactly match the DSH call. While that stream is active, a scoped `fetch` wrapper examines HTTP(S) `POST` JSON requests. It merges the rule only when the request body's top-level `model` matches. Other requests pass through unchanged. Invalid stored rule JSON is skipped and warned about once; API keys and request bodies are not logged.

## Verify installation

Run `dsh --profile <profile> --dump-default-config` and confirm the composed plugin tree contains the Loader entry `extra-body`. Restart DSH Desktop and check that **Settings → 请求附加字段** appears. A local `link:` installation uses the same checkout, so rebuilding the client and restarting Desktop is enough to load source changes.

## Limitations

- A custom field may be valid for one gateway protocol and rejected by another. Test each provider/model combination you configure.
- Only JSON model requests that use global `fetch` are intercepted. WebSocket traffic, multipart requests, and transports with their own networking path are unaffected.
- Rules cannot replace top-level `model`, `messages`, or `stream`. The editor requires a JSON object and rejects prototype-related keys.
- If the same provider/model pair appears more than once in stored settings, the first rule wins; the Desktop editor prevents saving duplicates.

## Troubleshooting

- **Settings page missing:** Check the profile name, confirm `lib/client.js` exists in the installed package, and restart DSH Desktop.
- **Rule saved but no field arrives:** Check the exact provider route and model ID, the top-level `model` in the outgoing JSON, and whether the transport uses global `fetch`. Inspect the gateway's request log and response for protocol-specific rejection.

## Local development and testing

The source is TypeScript under `src/`. DSH loads the compiled `lib/index.js` and `lib/client.js` files. To test a checkout:

```sh
npm ci
npm run typecheck
npm test
npm pack --dry-run
```

`npm test` type-checks, rebuilds both DSH entry points, and runs request, settings, browser-bundle, and theme tests. For a local checkout linked to a profile:

```sh
dsh plugin --profile <profile> add "link:/absolute/path/to/dsh-extra-body"
```

After changing source, run `npm run build` and restart DSH Desktop. The pack check verifies that the compiled host and client files are included.

## License

[MIT](./LICENSE)
