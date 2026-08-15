# AGENTS.md

## Bob OpenAI Translate Plugin

- 该项目为 Bob 的翻译插件。
- 该插件通过 OpenAI API ，调用用户指定的大模型以实现文本翻译。
- 插件中用户可自行配置的各类参数等相关内容，需完全遵守 OpenAI API 最新文档的要求。
- 插件配置界面中的文本内容，需实现多语言支持。
  - 插件配置界面中只显示单一语言，构建时可指定语言。
- 本地环境中，已通过 mise 配置了 node@24 。

### 插件相关

- 服务模式
  - 翻译
  - 润色
  - 自定义 Prompt
- 插件图标
  - Bob 内置图片
  - ID: 124

### Bob 介绍及相关文档

Bob 是一款 macOS 平台的翻译和 OCR 软件，您可以在任何应用程序中使用 Bob 进行翻译和 OCR，即用即走，简单、快捷、高效！

- [Bob](https://bobtranslate.com/)
- [开发插件 | Bob](https://bobtranslate.com/plugin/)

`docs/official_capture_01.png` 与 `docs/official_capture_02.png` 是 Bob 官方插件的界面截图。
官方插件已很久未更新，许多配置选项已不可用。
