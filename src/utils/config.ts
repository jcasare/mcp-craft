import { homedir, platform } from "os";
import { join } from "path";

export interface ClientConfig {
  name: string;
  configPath: string;
  configFormat: "json" | "toml";
  key: string; // the JSON/TOML key that holds server configs
  useCli?: boolean; // if true, register via CLI command instead of config file
  cliCommand?: string; // the CLI command to register (e.g., "claude mcp add")
}

export function getClientConfigs(): ClientConfig[] {
  const home = homedir();
  const os = platform();

  const clients: ClientConfig[] = [];

  // Claude Desktop
  if (os === "darwin") {
    clients.push({
      name: "Claude Desktop",
      configPath: join(home, "Library", "Application Support", "Claude", "claude_desktop_config.json"),
      configFormat: "json",
      key: "mcpServers",
    });
  } else if (os === "win32") {
    clients.push({
      name: "Claude Desktop",
      configPath: join(process.env.APPDATA || join(home, "AppData", "Roaming"), "Claude", "claude_desktop_config.json"),
      configFormat: "json",
      key: "mcpServers",
    });
  }

  // Claude Code (CLI)
  clients.push({
    name: "Claude Code",
    configPath: join(home, ".claude", "settings.json"),
    configFormat: "json",
    key: "mcpServers",
    useCli: true,
    cliCommand: "claude mcp add",
  });

  // Cursor
  clients.push({
    name: "Cursor",
    configPath: join(home, ".cursor", "mcp.json"),
    configFormat: "json",
    key: "mcpServers",
  });

  // Windsurf
  clients.push({
    name: "Windsurf",
    configPath: join(home, ".windsurf", "mcp.json"),
    configFormat: "json",
    key: "mcpServers",
  });

  // VS Code (workspace-level — checks .vscode/mcp.json in cwd)
  clients.push({
    name: "VS Code",
    configPath: join(process.cwd(), ".vscode", "mcp.json"),
    configFormat: "json",
    key: "servers",
  });

  // Codex (OpenAI CLI)
  clients.push({
    name: "Codex",
    configPath: join(home, ".codex", "config.toml"),
    configFormat: "toml",
    key: "mcpServers",
    useCli: true,
    cliCommand: "codex mcp add",
  });

  // Gemini CLI
  clients.push({
    name: "Gemini CLI",
    configPath: join(home, ".gemini", "settings.json"),
    configFormat: "json",
    key: "mcpServers",
    useCli: true,
    cliCommand: "gemini mcp add",
  });

  return clients;
}
