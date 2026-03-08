import { Command } from "commander";
import { execSync } from "child_process";
import { existsSync } from "fs";
import { join } from "path";
import chalk from "chalk";

export const inspectCommand = new Command("inspect")
  .description("Launch the MCP Inspector to test your server visually")
  .action(() => {
    const cwd = process.cwd();
    const entryPoint = join(cwd, "build", "index.js");

    if (!existsSync(entryPoint)) {
      // Try building first
      if (existsSync(join(cwd, "package.json"))) {
        console.log(chalk.dim("Build not found. Building first...\n"));
        try {
          execSync("npm run build", { cwd, stdio: "inherit" });
        } catch {
          console.error(chalk.red("Build failed. Fix errors and try again."));
          process.exit(1);
        }
      } else {
        console.error(chalk.red("Error: No MCP server project found in current directory."));
        process.exit(1);
      }
    }

    console.log(chalk.bold("\n🔍 Launching MCP Inspector...\n"));
    console.log(chalk.dim("This opens a browser UI where you can test your server interactively."));
    console.log(chalk.dim("Press Ctrl+C to stop.\n"));

    try {
      execSync(`npx -y @modelcontextprotocol/inspector node ${entryPoint}`, {
        cwd,
        stdio: "inherit",
      });
    } catch {
      // User pressed Ctrl+C — normal exit
    }
  });
