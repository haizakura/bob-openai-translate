# Bob OpenAI Translate

[简体中文](README.md)

An OpenAI-powered text plugin for [Bob](https://bobtranslate.com/) with support for:

- Translation based on the source and target languages detected by Bob
- Polishing while preserving the original language and meaning
- Custom Prompt mode with template variables
- The OpenAI Responses API, streaming output, request cancellation, and connection validation
- A Chinese-only or English-only configuration UI selected at build time

## Why this plugin was rebuilt

“Official plugin” below refers specifically to Bob's existing OpenAI translation plugin, not the Bob application itself. It has not been updated for a long time and currently has several limitations:

- Its default endpoint is still `/v1/chat/completions`. OpenAI continues to support Chat Completions, but recommends the Responses API for new projects. The old plugin therefore does not directly benefit from the newer API's unified output structure and current controls.
- Its model presets and configuration options can become outdated. The screenshots expose temperature, reasoning effort, output length, and other settings as a common set, while the parameters actually supported by current models vary. Some combinations may be unavailable or rejected after switching models.
- Adapting to new models largely depends on manually entering a model name and API path, without defaults, request mapping, or validation designed for the current Responses API.
- The old configuration UI keeps options visible even when they do not apply to the selected model, making it difficult to tell which fields will be sent and which combinations are supported.

This project uses the Responses API, provides a current default model and a custom model entry, and validates or handles request paths, optional parameters, streaming events, cancellation, and error responses. Model capabilities will continue to evolve; when selecting an explicit reasoning effort, verbosity, or custom model, consult the [OpenAI model catalog](https://developers.openai.com/api/docs/models).

## Installation

1. Build the required UI language with Node.js 24. See “Localized builds” below.
2. Double-click the matching `.bobplugin` package in `release/`.
3. Enter your OpenAI API key in Bob's service settings.

For development, you can also double-click the built `.bobplugin` directory in `dist/`.

## Localized builds

Each package contains exactly one UI language. The default build produces the Simplified Chinese version:

```bash
npm run build
# Equivalent to: npm run build -- --locale zh-Hans
```

Build the English version:

```bash
npm run build -- --locale en
# Shortcut: npm run build:en
```

Build both versions at once:

```bash
npm run build:all
```

The generated packages are:

- `release/openai-translate-zh-Hans-v0.1.0.bobplugin`
- `release/openai-translate-en-v0.1.0.bobplugin`

The `build:zh`, `build:en`, and `build:all` commands build the Chinese, English, and both versions respectively. Both packages use the same plugin identifier and option identifiers, so they are language variants of the same plugin. Installing one variant replaces the other.

## Homepage and update checking

The plugin homepage points to this project's [GitHub repository](https://github.com/haizakura/bob-openai-translate). Bob checks for new versions through the `appcast` URL in the plugin's `info.json`:

- The Chinese package uses `appcast.json` in the repository root.
- The English package uses `appcast_en.json` in the repository root.

Each appcast points to the matching language artifact in GitHub Releases, preventing an update from changing the plugin UI language. To prepare a new version, first synchronize the version in `package.json` and `src/info.json`, then run:

```bash
npm run release:prepare
```

This command builds both language variants, calculates the SHA-256 of each final package, and updates both appcasts. Create the GitHub Release with a `v<version>` tag and upload both `.bobplugin` files from `release/`.

## Configuration

The default configuration follows the current OpenAI API:

- Base URL: `https://api.openai.com`
- API path: `/v1/responses`
- Model: `gpt-5.6-luna`
- Maximum output: `4096` tokens
- Streaming: enabled
- `store: false`: response storage is always disabled to protect the privacy of text selected in Bob

`Reasoning Effort` defaults to `none` to reduce latency for everyday translation. `Text Verbosity` defaults to Auto, which omits that field from the request. When choosing another explicit value or a custom model, confirm that the target model supports the parameter.

### Custom Prompt variables

The role prompt and user instruction support these variables:

| Variable | Value |
| --- | --- |
| `$query.text` | Text to process |
| `$query.detectFromLang` | English name of the detected source language |
| `$query.detectToLang` | English name of the detected target language |
| `$query.detectFrom` | Bob source language code |
| `$query.detectTo` | Bob target language code |

Example:

```text
Rewrite the following $query.detectFromLang text in a concise, professional tone:
$query.text
```

## Development

The project has no third-party npm dependencies:

```bash
npm run check
npm test
npm run build:all
npm run release:prepare
```

Language-neutral plugin structure is maintained in `src/info.json`. Chinese and English UI copy live in `src/locales/zh-Hans.json` and `src/locales/en.json` respectively. The check script validates both option structures and translation completeness, and prevents Chinese copy from returning to the structure file or leaking into the English UI.

Each build artifact is a zip archive with a `.bobplugin` extension. Its root directly contains the single-language `info.json`, `main.js`, and `modules/`.

`src/main.js` contains only the entry functions required by Bob. Translation orchestration and validation live in `src/modules/service.js`, with the remaining responsibilities split across `src/modules/`. Runtime code uses Bob's officially supported [`require` / `module.exports`](https://bobtranslate.com/plugin/api/module.html) module system.

## API and privacy

- The API key is sent only in the `Authorization: Bearer …` header to the configured API Base URL. It is never written to logs or build artifacts.
- The text being processed is sent to the API service configured by the user.
- A custom Base URL changes the recipient of both the API key and text. Use trusted services only.
- The plugin does not enable OpenAI tool calls or maintain conversation state across requests.

References: [OpenAI Responses API migration guide](https://developers.openai.com/api/docs/guides/migrate-to-responses), [OpenAI model catalog](https://developers.openai.com/api/docs/models), and [Bob plugin development documentation](https://bobtranslate.com/plugin/).
