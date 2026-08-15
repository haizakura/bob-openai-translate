# Bob OpenAI Translate

[English](README_en.md)

一个面向 [Bob](https://bobtranslate.com/) 的 OpenAI 文本插件，支持：

- 翻译：按 Bob 检测到的源语言和目标语言翻译
- 润色：在不改变原语言和含义的前提下改善表达
- 自定义 Prompt：通过模板变量自由定义任务
- OpenAI Responses API、流式输出、请求取消和连接验证
- 构建时可选择纯中文或纯英文配置界面

## 为什么重新实现

这里的“官方插件”特指 Bob 现有的 OpenAI 翻译插件，并非 Bob 应用本身。它已经较长时间没有更新，当前主要存在以下局限：

- 默认仍使用 `/v1/chat/completions`。Chat Completions 目前仍受 OpenAI 支持，但 OpenAI 已建议新项目优先使用 Responses API；旧插件因而无法直接利用新接口的统一输出结构和当前控制项。
- 模型列表和配置项容易过时。截图中的预设模型及统一展示的温度、推理强度、输出长度等选项，与当前模型实际支持范围并不总是一致，切换模型后可能出现某些配置不可用或请求被拒绝的情况。
- 适配新模型主要依赖用户手动填写模型名称和接口路径，缺少面向当前 Responses API 的默认值、参数映射与校验。
- 旧配置界面仍会保留已经不适用于所选模型的选项，用户较难判断哪些字段会真正发送、哪些组合受模型支持。

本项目改用 Responses API，提供当前默认模型与自定义模型入口，并对请求路径、可选参数、流式事件、取消操作及错误响应进行校验和处理。模型能力仍会随 OpenAI 更新；选择显式推理强度、详细程度或自定义模型时，请以 [OpenAI 模型目录](https://developers.openai.com/api/docs/models)为准。

## 安装

1. 使用 Node.js 24 构建所需界面语言（见下方“本地化构建”）。
2. 双击 `release/` 中对应语言的 `.bobplugin` 安装包。
3. 在 Bob 的服务设置中填写 OpenAI API Key。

开发调试时也可以直接双击 `dist/` 中构建出的 `.bobplugin` 目录。

## 本地化构建

每个安装包的插件界面只包含一种语言。默认构建简体中文版：

```bash
npm run build
# 等同于：npm run build -- --locale zh-Hans
```

生成英文版：

```bash
npm run build -- --locale en
# 快捷命令：npm run build:en
```

一次生成两个版本：

```bash
npm run build:all
```

对应产物为：

- `release/openai-translate-zh-Hans-v1.0.0.bobplugin`
- `release/openai-translate-en-v1.0.0.bobplugin`

`build:zh`、`build:en` 和 `build:all` 分别用于中文、英文和双版本构建。两个版本使用相同的插件标识符和配置项标识符，因此它们是同一插件的不同语言构建，安装另一版本会替换当前版本。

## 配置

默认配置遵循当前 OpenAI API：

- Base URL：`https://api.openai.com`
- API Path：`/v1/responses`
- 模型：`gpt-5.6-luna`
- 最大输出：`4096` tokens
- 流式输出：启用
- `store: false`：插件固定关闭 OpenAI 服务端响应存储，保护 Bob 中选取文本的隐私

`Reasoning Effort` 默认为 `none`，以降低日常翻译延迟；`Text Verbosity` 默认为“自动”，不发送对应字段。选择其他显式值或自定义模型时，请确认目标模型支持相应参数。

### 自定义 Prompt 变量

角色设定和用户指令支持以下变量：

| 变量 | 内容 |
| --- | --- |
| `$query.text` | 待处理文本 |
| `$query.detectFromLang` | 检测到的源语言英文名称 |
| `$query.detectToLang` | 检测到的目标语言英文名称 |
| `$query.detectFrom` | Bob 源语言代码 |
| `$query.detectTo` | Bob 目标语言代码 |

例如：

```text
Rewrite the following $query.detectFromLang text in a concise, professional tone:
$query.text
```

## 开发

项目不依赖第三方 npm 包：

```bash
npm run check
npm test
npm run build:all
```

中文文案维护在 `src/info.json`，英文翻译维护在 `src/locales/en.json`。检查脚本会验证两种语言的选项结构、翻译完整性及英文界面中是否意外混入中文。

构建产物是一个根目录直接包含单语言 `info.json`、`main.js` 与 `lib/` 的 zip 文件，并使用 `.bobplugin` 扩展名。

## API 与隐私说明

- API Key 只通过 `Authorization: Bearer …` 请求头发送到配置的 API Base URL，不写入日志或构建产物。
- 待处理文本会发送到用户配置的 API 服务。
- 自定义 Base URL 会改变密钥和文本的接收方，请只使用可信服务。
- 本插件不启用 OpenAI 工具调用，也不维护跨请求对话状态。

参考：[OpenAI Responses API 迁移指南](https://developers.openai.com/api/docs/guides/migrate-to-responses)、[OpenAI 模型目录](https://developers.openai.com/api/docs/models)、[Bob 插件开发文档](https://bobtranslate.com/plugin/)。
