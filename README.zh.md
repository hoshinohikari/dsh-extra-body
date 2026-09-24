# dsh-extra-body

为 [DSH（DeepSeek Harness）](https://github.com/deepseek-ai/deepseek-harness) 中指定的 `llm-pi-ai` 供应商与模型添加自定义 JSON 请求字段。规则可在 DSH Desktop 中编辑；命中的后续请求会使用规则，无需改动模型的能力声明。

[![License: MIT](https://img.shields.io/github/license/hoshinohikari/dsh-extra-body)](./LICENSE)

- [English README](./README.md)

> **兼容边界：** 插件只处理匹配的 DSH `llm/stream` 调用期间，通过进程全局 `fetch` 发出的 HTTP(S) `POST` JSON 请求。通常从请求体顶层 `model` 匹配模型；原生 Gemini `generateContent` 和 `streamGenerateContent` 则从 URL 路径读取模型，保留该路径的代理也适用。目标接口必须接受所添加的字段。WebSocket、非 JSON 请求体，以及不使用全局 `fetch` 的传输不在作用范围内。

## 为什么需要它？

部分兼容 OpenAI 的网关支持 DSH 标准模型配置尚未声明的请求字段。例如 Requesty 文档中的 `requesty.auto_cache`。本插件可以只为一个供应商与模型添加这些字段，不影响其他模型，也不需要修改 DSH 本身。

## 标识说明

| 用途 | 标识 |
| --- | --- |
| 包名与 Cordis 插件名 | `dsh-extra-body` |
| Loader 条目 ID | `extra-body` |
| 旧版 namespace 设置分区 | `dsh-extra-body` |
| 新版 entry-config 设置分区 | `extra-body` |

## 功能概览

- 从现有 `llm-pi-ai` 设置中自动发现供应商和模型；可按供应商、模型名称或模型 ID 搜索，再展开模型编辑规则。
- 使用 DSH 的共用语言设置在中文与 English 之间切换；侧栏标题、编辑区和校验提示会随之更新。
- 精确匹配 DSH 的供应商路由与模型 ID。命中的 JSON 请求可以来自 Chat Completions、Responses、Messages 或其他模型端点。原生 Google Gemini `generateContent` 和 `streamGenerateContent` 请求会从 URL 路径读取模型 ID 进行匹配。
- 对请求 JSON 中的对象字段递归合并；同名数组和标量由规则值替换。
- 在 Desktop 页面校验 JSON。模型从清单中消失后，其已保存规则仍可查看和删除。
- 同时支持旧版 `connection.api.settings` RPC 与新版 `remote.settings` 服务。

## 安装、升级与卸载

使用 DSH 官方 `dsh plugin` 命令管理运行中的 profile。仓库已包含构建好的宿主和客户端文件，从 GitHub 安装无需在本地编译 TypeScript。

```sh
# 安装
dsh plugin --profile <profile> add github:hoshinohikari/dsh-extra-body

# 升级已有的 GitHub 安装
dsh plugin --profile <profile> update dsh-extra-body

# 卸载
dsh plugin --profile <profile> remove dsh-extra-body
```

安装或升级后重启 DSH Desktop，再打开 **设置 → 请求附加字段**。

## 快速使用

1. 先在 DSH 的**模型**设置中配置目标供应商与模型。
2. 打开 **设置 → 请求附加字段**，展开对应供应商和模型，填入一个 JSON 对象。
3. 保存规则并发起模型请求；通过网关的请求记录确认字段已送达。

以 Requesty 自动缓存为例，在模型编辑器中填入：

```json
{
  "requesty": {
    "auto_cache": true
  }
}
```

对应的已存规则形态是：

```yaml
rules:
  - provider: requesty
    model: anthropic/claude-opus-5
    body: '{"requesty":{"auto_cache":true}}'
```

请使用**你自己的** DSH 配置中的供应商路由和模型 ID。`extra_body` 是 Python SDK 的调用参数名，不是要发送的 JSON 键；发给 Requesty 的 JSON 顶层字段是 `requesty`。

## 工作方式

在旧版 namespace 设置模型中，宿主注册自己的设置分区；在新版 entry-config 模型中，导出的 `Config` 提供该分区。Desktop 页面读取这个分区及现有 `llm-pi-ai` 模型清单；保存时带设置修订号写入插件自己的 `rules` 数组。

每次 `llm/stream` 调用，宿主选出第一条与 DSH 调用的供应商和模型都精确匹配的规则。在该流有效期间，请求作用域内的 `fetch` 包装器检查 HTTP(S) `POST` JSON 请求；通过请求体顶层 `model` 匹配，原生 Gemini 生成端点则通过 URL 中的模型 ID 匹配后合并字段。其他请求保持原样。错误的已存 JSON 规则会被跳过并只警告一次；插件不记录 API 密钥和请求体。

## 安装验证

运行 `dsh --profile <profile> --dump-default-config`，确认组合后的插件树包含 Loader 条目 `extra-body`。重启 DSH Desktop，检查 **设置 → 请求附加字段** 是否出现。使用本地 `link:` 安装时，修改源码后重新构建客户端并重启 Desktop 即可加载改动。

## 重要限制

- 同一自定义字段可能被某种网关协议接受，却被另一种协议拒绝；请逐个验证所配置的供应商与模型。
- 原生 Gemini 路径匹配覆盖 `generateContent` 和 `streamGenerateContent` URL；保留 Google 模型路径的代理也适用。自定义字段是否受支持仍取决于目标端点。
- 只拦截使用全局 `fetch` 的 JSON 模型请求。WebSocket、multipart 请求及自行处理网络传输的适配器不会受影响。
- 规则不能覆盖顶层 `model`、`messages` 或 `stream`。编辑器要求填入 JSON 对象，并拒绝与原型相关的不安全键。
- 如果已存设置中出现重复的供应商与模型组合，第一条规则生效；Desktop 编辑器会阻止保存重复项。

## 排查

- **设置页未出现：** 检查 profile 名称，确认已安装的包内存在 `lib/client.js`，然后重启 DSH Desktop。
- **规则已保存但字段未送达：** 核对供应商路由、模型 ID、请求 JSON 顶层 `model`，以及该传输是否使用全局 `fetch`。查看网关请求记录和响应，确认协议是否拒绝了自定义字段。

## 本地开发与测试

TypeScript 源码位于 `src/`，DSH 加载的是编译后的 `lib/index.js` 与 `lib/client.js`。在项目目录中运行：

```sh
npm ci
npm run typecheck
npm test
npm pack --dry-run
```

`npm test` 会检查类型、重新构建两个 DSH 入口，并运行请求、设置、浏览器 bundle 和主题测试。若要把本地目录链接到某个 profile：

```sh
dsh plugin --profile <profile> add "link:/absolute/path/to/dsh-extra-body"
```

修改源码后运行 `npm run build` 并重启 DSH Desktop。打包检查用于确认发布包包含编译好的宿主和客户端文件。

## 许可证

[MIT](./LICENSE)
