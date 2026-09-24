# dsh-extra-body

Add custom JSON fields to one DSH `llm-pi-ai` model's generation requests. Rules match the DSH provider route and exact model ID. Any HTTP(S) `POST` JSON request made during that model's `llm/stream` call is changed when its top-level `model` matches. This covers Chat Completions, Responses, Messages, and other JSON model endpoints that use global `fetch`.

## Requesty example

Configure a rule with the provider route and model ID used in DSH:

```yaml
rules:
  - provider: requesty
    model: anthropic/claude-opus-5
    body: '{"requesty":{"auto_cache":true}}'
```

The outgoing JSON contains `"requesty": {"auto_cache": true}` at the top level. `extra_body` is a Python SDK argument and is **not** sent as a JSON key.

After installation, open **Settings → 请求附加字段** in DSH Desktop. The page discovers providers and models from the existing `llm-pi-ai` settings section, groups models by provider, and supports searching by provider, model name, or model ID. Expand a model, enter a JSON object, and save its rule. Rules whose models disappear from the inventory remain visible so they can be reviewed or removed.

The settings section is the Loader entry `extra-body` on DSH 0.1.7 and later. On older namespace-based DSH versions it is `dsh-extra-body`. The Desktop page supports both Settings RPC transports. The same rules can also be written under `dsh-extra-body:` in an older profile's Settings YAML.

## Install

Install the prebuilt bundle with the official `dsh plugin` command; do not copy the folder into a profile by hand:

```sh
dsh plugin --profile <profile> add github:hoshinohikari/dsh-extra-body
```

For local development, clone the repository, build the client, and link the checkout to your profile:

```sh
git clone git@github.com:hoshinohikari/dsh-extra-body.git
cd dsh-extra-body
npm install
npm run build
dsh plugin --profile <profile> add "link:/absolute/path/to/dsh-extra-body"
```

The CLI adds the dependency and bundle layer to the selected profile. Restart DSH Desktop, then open **Settings → 请求附加字段**. A linked checkout needs a client rebuild and Desktop restart after source changes.

The plugin leaves unmatched requests unchanged. The first rule for a provider and model wins. It merges object fields recursively and replaces arrays or scalar values at the same key. It refuses rules that replace top-level `model`, `messages`, or `stream`. A malformed JSON rule is ignored and logged once. No API keys or request bodies are logged. Non-JSON requests, WebSocket transports, and SDKs that bypass global `fetch` are outside this interception point. A provider must accept the custom field on each protocol you use.

The current DSH pi-ai adapter does not expose the SDK's `onPayload` callback to plugins. This plugin therefore wraps `fetch` during `llm/stream` iteration, following the same request-context pattern used by `dsh-thinking-effort`. It requires a transport that uses the process's global `fetch`; other transports are left unchanged.
