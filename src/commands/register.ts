import { Command } from "commander";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { resolve, dirname, join } from "path";
import chalk from "chalk";
import inquirer from "inquirer";
import { execSync } from "child_process";
import { getClientConfigs, type ClientConfig } from "../utils/config.js";

function readJsonConfig(path: string): Record<string, unknown> {
  if (!existsSync(path)) return {};
  try {
    return JSON.parse(readFileSync(path, "utf-8"));
  } catch {
    return {};
  }
}

function writeJsonConfig(path: string, data: Record<string, unknown>): void {
  const dir = dirname(path);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(path, JSON.stringify(data, null, 2) + "\n");
}

function registerViaConfigFile(
  client: ClientConfig,
  serverName: string,
  serverEntry: Record<string, unknown>
): void {
  const config = readJsonConfig(client.configPath);
  const servers = (config[client.key] || {}) as Record<string, unknown>;
  servers[serverName] = serverEntry;
  config[client.key] = servers;
  writeJsonConfig(client.configPath, config);
  console.log(chalk.green(`  ✓ Registered with ${client.name}`));
  console.log(chalk.dim(`    Config: ${client.configPath}`));
}

function registerViaCli(
  client: ClientConfig,
  serverName: string,
  entryPoint: string
): void {
  const cmd = `${client.cliCommand} ${serverName} node ${entryPoint}`;
  try {
    execSync(cmd, { stdio: "pipe" });
    console.log(chalk.green(`  ✓ Registered with ${client.name}`));
    console.log(chalk.dim(`    Command: ${cmd}`));
  } catch {
    console.log(chalk.yellow(`  ⚠ Could not register with ${client.name}`));
    console.log(chalk.dim(`    Is ${client.cliCommand?.split(" ")[0]} installed?`));
    console.log(chalk.dim(`    Manual command: ${cmd}`));
  }
}

export const registerCommand = new Command("register")
  .description("Register your MCP server with AI clients")
  .action(async () => {
    console.log(chalk.bold("\n📋 mcp-craft register\n"));

    const cwd = process.cwd();
    const packageJsonPath = join(cwd, "package.json");

    if (!existsSync(packageJsonPath)) {
      console.error(chalk.red("Error: No package.json found. Are you in an MCP server project?"));
      process.exit(1);
    }

    const pkg = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
    const serverName = pkg.name || "my-mcp-server";
    const entryPoint = resolve(cwd, "build", "index.js");

    if (!existsSync(entryPoint)) {
      console.log(chalk.yellow("Build not found. Run `npm run build` first.\n"));
      process.exit(1);
    }

    // Detect available clients
    const allClients = getClientConfigs();
    const availableClients = allClients.filter((c) => {
      if (c.useCli) {
        // Check if the CLI tool exists
        try {
          execSync(`which ${c.cliCommand!.split(" ")[0]}`, { stdio: "pipe" });
          return true;
        } catch {
          return false;
        }
      }
      // For config-file clients, check if the parent directory exists
      // (indicates the app is likely installed)
      return existsSync(dirname(c.configPath));
    });

    if (availableClients.length === 0) {
      console.log(chalk.yellow("No supported AI clients detected.\n"));
      console.log(chalk.dim("Supported clients: " + allClients.map((c) => c.name).join(", ")));
      process.exit(1);
    }

    // Let user pick which clients to register with
    const { selectedClients } = await inquirer.prompt([
      {
        type: "checkbox",
        name: "selectedClients",
        message: "Which clients should we register with?",
        choices: availableClients.map((c) => ({
          name: c.name,
          value: c,
          checked: true,
        })),
      },
    ]);

    if (selectedClients.length === 0) {
      console.log(chalk.dim("\nNo clients selected.\n"));
      return;
    }

    console.log("");

    const serverEntry = {
      command: "node",
      args: [entryPoint],
    };

    for (const client of selectedClients as ClientConfig[]) {
      if (client.useCli) {
        registerViaCli(client, serverName, entryPoint);
      } else {
        registerViaConfigFile(client, serverName, serverEntry);
      }
    }

    console.log(chalk.bold.green("\n✓ Registration complete!\n"));
    console.log(chalk.dim("Restart your AI client(s) for changes to take effect.\n"));
  });
