import { Command } from "commander";
import { spawn, execSync } from "child_process";
import { existsSync } from "fs";
import { join } from "path";
import chalk from "chalk";
import ora from "ora";

interface JsonRpcRequest {
  jsonrpc: "2.0";
  id: number;
  method: string;
  params?: Record<string, unknown>;
}

interface JsonRpcResponse {
  jsonrpc: "2.0";
  id: number;
  result?: Record<string, unknown>;
  error?: { code: number; message: string };
}

function sendRequest(
  proc: ReturnType<typeof spawn>,
  request: JsonRpcRequest
): Promise<JsonRpcResponse> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`Timeout waiting for response to ${request.method}`));
    }, 10000);

    const onData = (data: Buffer) => {
      const lines = data.toString().split("\n").filter(Boolean);
      for (const line of lines) {
        try {
          const parsed = JSON.parse(line);
          if (parsed.id === request.id) {
            clearTimeout(timeout);
            proc.stdout?.off("data", onData);
            resolve(parsed);
            return;
          }
        } catch {
          // Not JSON — skip (could be a log line on stderr leaking)
        }
      }
    };

    proc.stdout?.on("data", onData);
    proc.stdin?.write(JSON.stringify(request) + "\n");
  });
}

export const testCommand = new Command("test")
  .description("Validate your MCP server (build, connect, check responses)")
  .action(async () => {
    console.log(chalk.bold("\n🧪 mcp-craft test\n"));

    const cwd = process.cwd();
    const packageJsonPath = join(cwd, "package.json");
    const buildDir = join(cwd, "build");
    const entryPoint = join(buildDir, "index.js");

    // Check we're in a valid project
    if (!existsSync(packageJsonPath)) {
      console.error(chalk.red("Error: No package.json found. Are you in an MCP server project?"));
      process.exit(1);
    }

    // Step 1: Build
    const buildSpinner = ora("Building project...").start();
    try {
      execSync("npm run build", { cwd, stdio: "pipe" });
      buildSpinner.succeed("Build successful");
    } catch (error) {
      buildSpinner.fail("Build failed");
      const err = error as { stderr?: Buffer };
      if (err.stderr) {
        console.error(chalk.dim(err.stderr.toString()));
      }
      process.exit(1);
    }

    if (!existsSync(entryPoint)) {
      console.error(chalk.red("Error: build/index.js not found after build."));
      process.exit(1);
    }

    // Step 2: Spawn server
    const connectSpinner = ora("Connecting to server...").start();

    const proc = spawn("node", [entryPoint], {
      stdio: ["pipe", "pipe", "pipe"],
      cwd,
    });

    let serverError = "";
    proc.stderr?.on("data", (data) => {
      serverError += data.toString();
    });

    // Give the server a moment to start
    await new Promise((r) => setTimeout(r, 500));

    if (proc.exitCode !== null) {
      connectSpinner.fail("Server exited immediately");
      if (serverError) console.error(chalk.dim(serverError));
      process.exit(1);
    }

    // Step 3: Initialize
    try {
      const initResponse = await sendRequest(proc, {
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2025-06-18",
          capabilities: {},
          clientInfo: { name: "mcp-craft-test", version: "1.0.0" },
        },
      });

      if (initResponse.error) {
        connectSpinner.fail("Initialize failed");
        console.error(chalk.red(`  Error: ${initResponse.error.message}`));
        proc.kill();
        process.exit(1);
      }

      connectSpinner.succeed("Connected and initialized");

      const result = initResponse.result as {
        serverInfo?: { name: string; version: string };
        capabilities?: Record<string, unknown>;
      };

      if (result?.serverInfo) {
        console.log(
          chalk.dim(`  Server: ${result.serverInfo.name} v${result.serverInfo.version}`)
        );
      }

      // Send initialized notification
      proc.stdin?.write(
        JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) + "\n"
      );

      // Step 4: List tools
      const toolsSpinner = ora("Listing tools...").start();
      const toolsResponse = await sendRequest(proc, {
        jsonrpc: "2.0",
        id: 2,
        method: "tools/list",
        params: {},
      });

      const tools = (toolsResponse.result as { tools?: { name: string; description?: string }[] })?.tools || [];
      if (tools.length > 0) {
        toolsSpinner.succeed(`Found ${tools.length} tool(s)`);
        for (const tool of tools) {
          console.log(chalk.dim(`  • ${tool.name} — ${tool.description || "no description"}`));
        }
      } else {
        toolsSpinner.info("No tools registered");
      }

      // Step 5: List resources
      const resourcesSpinner = ora("Listing resources...").start();
      const resourcesResponse = await sendRequest(proc, {
        jsonrpc: "2.0",
        id: 3,
        method: "resources/list",
        params: {},
      });

      const resources = (resourcesResponse.result as { resources?: { name: string; uri: string }[] })?.resources || [];
      if (resources.length > 0) {
        resourcesSpinner.succeed(`Found ${resources.length} resource(s)`);
        for (const resource of resources) {
          console.log(chalk.dim(`  • ${resource.name} (${resource.uri})`));
        }
      } else {
        resourcesSpinner.info("No resources registered");
      }

      // Step 6: List prompts
      const promptsSpinner = ora("Listing prompts...").start();
      const promptsResponse = await sendRequest(proc, {
        jsonrpc: "2.0",
        id: 4,
        method: "prompts/list",
        params: {},
      });

      const prompts = (promptsResponse.result as { prompts?: { name: string; description?: string }[] })?.prompts || [];
      if (prompts.length > 0) {
        promptsSpinner.succeed(`Found ${prompts.length} prompt(s)`);
        for (const prompt of prompts) {
          console.log(chalk.dim(`  • ${prompt.name} — ${prompt.description || "no description"}`));
        }
      } else {
        promptsSpinner.info("No prompts registered");
      }

      // Summary
      console.log(chalk.bold.green("\n✓ All checks passed!\n"));

      const total = tools.length + resources.length + prompts.length;
      console.log(
        chalk.dim(
          `  Your server exposes ${tools.length} tool(s), ${resources.length} resource(s), and ${prompts.length} prompt(s).`
        )
      );

      if (total === 0) {
        console.log(
          chalk.yellow(
            "\n  Warning: Your server has no tools, resources, or prompts.\n" +
            "  Use `mcp-craft add tool <name>` to add functionality.\n"
          )
        );
      }

      console.log("");
    } catch (error) {
      console.error(chalk.red(`\nError: ${error}`));
      if (serverError) {
        console.error(chalk.dim("\nServer stderr:"));
        console.error(chalk.dim(serverError));
      }
      proc.kill();
      process.exit(1);
    }

    proc.kill();
  });
