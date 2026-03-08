# mcp-craft

[![npm version](https://img.shields.io/npm/v/mcp-craft)](https://www.npmjs.com/package/mcp-craft)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

CLI toolkit for scaffolding, testing, and managing [MCP (Model Context Protocol)](https://modelcontextprotocol.io) servers.

Build MCP servers in seconds, not hours.

## What is MCP?

MCP is like a **USB port for AI apps**. It's an open protocol that lets AI applications (Claude, Cursor, VS Code Copilot, Gemini, Codex) connect to external tools and data sources through a standard interface.

You build a server once, and any MCP-compatible AI app can use it.

| Primitive | What it is | Example |
| ------------- | -------------------------------- | ------------------------------------------------- |
| **Tools** | Functions the AI can call | `get_weather`, `search_database`, `send_email` |
| **Resources** | Data the AI can read | Files, DB records, API responses |
| **Prompts** | Reusable message templates | `code_review`, `summarize`, `translate` |

## Installation

```bash
npm install -g mcp-craft
```

Or use without installing:

```bash
npx mcp-craft init my-server
```

## Quick Start

```bash
# 1. Scaffold a new MCP server
mcp-craft init my-server

# 2. Install dependencies and build
cd my-server
npm install
npm run build

# 3. Add more capabilities
mcp-craft add tool search_docs
mcp-craft add resource config

# 4. Test your server
mcp-craft test

# 5. Register with your AI clients
mcp-craft register
```

## Commands

### `mcp-craft init [name]`

Interactively scaffold a new MCP server project. Asks you for:

- Project name and description
- Transport type (stdio or HTTP)
- Which primitives to include (tools, resources, prompts)

Generates a complete, ready-to-build TypeScript project with example code.

### `mcp-craft add <type> <name>`

Add a new tool, resource, or prompt to an existing MCP server project.

```bash
mcp-craft add tool get_weather     # Add a tool
mcp-craft add resource user_data   # Add a resource
mcp-craft add prompt code_review   # Add a prompt
```

### `mcp-craft test`

Validate your MCP server:

1. Builds the project (`npm run build`)
2. Spawns the server as a subprocess
3. Sends JSON-RPC `initialize` request
4. Lists all tools, resources, and prompts
5. Reports pass/fail with details

### `mcp-craft inspect`

Launch the [MCP Inspector](https://github.com/modelcontextprotocol/inspector) — a visual browser-based tool for testing your server interactively.

### `mcp-craft register`

Register your MCP server with installed AI clients. Detects which clients are installed and updates their config files (or runs their CLI commands).

## Supported AI Clients

| Client | Method | Config Location |
| -------------- | ----------------------- | ------------------------------------------------------------------ |
| Claude Desktop | Config file | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Claude Code | CLI (`claude mcp add`) | `~/.claude/settings.json` |
| Cursor | Config file | `~/.cursor/mcp.json` |
| Windsurf | Config file | `~/.windsurf/mcp.json` |
| VS Code | Config file | `.vscode/mcp.json` |
| Codex (OpenAI) | CLI (`codex mcp add`) | `~/.codex/config.toml` |
| Gemini CLI | CLI (`gemini mcp add`) | `~/.gemini/settings.json` |

## Generated Project Structure

```text
my-server/
├── src/
│   └── index.ts          # Server entry point with tools/resources/prompts
├── build/                # Compiled output (gitignored)
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript config
└── README.md             # Auto-generated docs
```

## Contributing

Contributions are welcome! Please feel free to submit a pull request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -m 'Add my feature'`)
4. Push to the branch (`git push origin feature/my-feature`)
5. Open a Pull Request

## License

[MIT](LICENSE)
