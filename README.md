# CatMit — AI Commit Message Generator

Generate conventional commit messages with AI. One click in VS Code, one command in the terminal.

CatMit reads your staged git changes, sends them to your chosen AI provider (OpenAI, Anthropic Claude, Google Gemini, NVIDIA Build, or Ollama), and generates clean, standardized commit messages. Available as a **VS Code / Windsurf extension** and a **CLI tool**.

[![VS Code Marketplace](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2Fjansencruz23%2Fcatmit%2Fmain%2Fpackage.json&query=%24.version&prefix=v&label=VS%20Code%20Marketplace&color=blue&logo=visualstudiocode)](https://marketplace.visualstudio.com/items?itemName=jansencruz23.catmit)
[![npm](https://img.shields.io/npm/v/catmit)](https://www.npmjs.com/package/catmit)
[![Open VSX](https://img.shields.io/open-vsx/v/jansencruz23/catmit?label=Open%20VSX)](https://open-vsx.org/extension/jansencruz23/catmit)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- **Generate commit messages** from staged diffs using AI
- **Multiple AI providers** — OpenAI, Anthropic, Google Gemini, NVIDIA Build, Ollama (local)
- **Bring Your Own Key** — use your own API keys, stored securely in the OS keychain
- **6 commit formats** — Conventional, Angular, Karma, Emoji/Gitmoji, Semantic, Simple
- **One-command push** — stage, generate, commit, and push in a single step
- **Amend support** — regenerate and replace the last commit message
- **VS Code integration** — cat paw button in Source Control, works in dark and light mode
- **Polished CLI** — React + Ink terminal UI with interactive setup, spinners, and status messages

## VS Code Extension

### Quick Start

1. Install CatMit from the VS Code Marketplace
2. Open the Command Palette (`Ctrl+Shift+P`) and run **Catmit: Set API Key**
3. Set your provider in Settings > search "catmit.provider"
4. Open the Source Control tab — click the cat paw icon to generate a commit message

### Commands

| Command | Description |
|---------|-------------|
| **Catmit: Generate Commit Message** | Auto-stages changes, generates a message, and fills the SCM input box |
| **Catmit: Stage, Commit & Push** | Full pipeline — stage, generate, commit, and push to remote |
| **Catmit: Amend Last Commit Message** | Regenerates and amends the previous commit message |
| **Catmit: Set API Key** | Securely store your API key in the OS keychain |

### Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `catmit.provider` | (none) | AI provider: `openai`, `anthropic`, `gemini`, `nvidia`, or `ollama` |
| `catmit.model` | (auto) | Override the default model for the selected provider |
| `catmit.format` | `conventional` | Commit format: `conventional`, `angular`, `karma`, `emoji`, `semantic`, `simple` |
| `catmit.maxLength` | `72` | Maximum subject line length |
| `catmit.includeBody` | `auto` | Include a commit body: `auto`, `always`, `never` |
| `catmit.includeBullets` | `auto` | Bullet-point summary in body: `auto`, `always`, `never` |
| `catmit.maxBullets` | `5` | Maximum number of bullet points in the commit body (1–20) |
| `catmit.ollamaUrl` | `http://localhost:11434` | Ollama server URL (for local models) |
| `catmit.language` | `en` | Commit message language |

## CLI

### Install

```bash
npm install -g catmit
```

### Setup

```bash
catmit setup
```

This walks you through selecting a provider, model, and API key. The API key is stored in your OS keychain (Windows Credential Manager, macOS Keychain, or Linux Secret Service).

### Usage

```bash
# Generate a commit message from staged changes
catmit

# Generate and auto-commit
catmit --commit

# Stage all, generate, commit, and push in one step
catmit push

# Regenerate the last commit message
catmit amend

# Regenerate and apply the amend
catmit amend --apply

# Use a specific provider or format
catmit -p anthropic -f emoji

# Cap the body to 3 bullet points
catmit --max-bullets 3

# List available providers and default models
catmit models
```

### CLI Options

```
catmit [generate]          Generate a commit message (default command)
  -p, --provider <name>    AI provider (openai, anthropic, gemini, nvidia, ollama)
  -m, --model <name>       Override model
  -f, --format <format>    Commit format (conventional, angular, karma, emoji, semantic, simple)
  -b, --max-bullets <n>    Maximum number of body bullet points
  -c, --commit             Auto-commit with the generated message

catmit push                Stage all, generate, commit, and push
catmit amend               Regenerate last commit message
  -a, --apply              Apply the new message to the last commit
catmit setup               Interactive provider and API key setup
catmit models              List providers and default models
```

### Persisting settings

CLI flags only apply to a single invocation. To persist any setting, drop a `.catmitrc.json` in your repo root (shared with the team) or in your home directory (global):

```json
{
  "format": "conventional",
  "maxLength": 72,
  "maxBullets": 3,
  "language": "en"
}
```

Environment variables also work: `CATMIT_PROVIDER`, `CATMIT_MODEL`, `CATMIT_FORMAT`, `CATMIT_MAX_BULLETS`, `CATMIT_LANGUAGE`, `OLLAMA_URL`.

## Supported Providers

| Provider | Default Model | API Key Env Var |
|----------|---------------|-----------------|
| OpenAI | gpt-4o-mini | `OPENAI_API_KEY` |
| Anthropic | claude-sonnet-4-20250514 | `ANTHROPIC_API_KEY` |
| Google Gemini | gemini-2.5-flash | `GOOGLE_API_KEY` |
| NVIDIA Build | nvidia/llama-3.1-nemotron-70b-instruct | `NVIDIA_API_KEY` |
| Ollama (local) | llama3.2 | (none needed) |

You can override the model with `-m` or the `catmit.model` setting.

## Commit Formats

| Format | Example |
|--------|---------|
| `conventional` | `feat(auth): add OAuth2 login flow` |
| `angular` | `feat(auth): add OAuth2 login flow` |
| `karma` | `feat(auth): add OAuth2 login flow` |
| `emoji` | `:sparkles: add OAuth2 login flow` |
| `semantic` | `feat: add OAuth2 login flow` |
| `simple` | `Add OAuth2 login flow` |

## Security

- **API keys are stored in the OS keychain**, not in plaintext config files
- VS Code extension uses `SecretStorage` (OS-level encryption)
- CLI uses `@github/keytar` for native keychain access
- No `--api-key` CLI flag — keys are never exposed in shell history or process listings
- `.catmitrc.json` is gitignored and only stores non-sensitive settings (provider, model, format)
- Environment variables (`OPENAI_API_KEY`, `NVIDIA_API_KEY`, etc.) are supported as an alternative

## Configuration Priority

Settings are resolved in this order (highest priority first):

1. CLI flags (`-p`, `-m`, `-f`)
2. OS Keychain (API key)
3. Environment variables
4. `.catmitrc.json` (project directory, then home directory)
5. VS Code settings (for the extension)
6. Defaults

## Requirements

- Node.js 18+
- Git installed and available in PATH
- An API key from one of the supported providers (or Ollama running locally)

## License

MIT
