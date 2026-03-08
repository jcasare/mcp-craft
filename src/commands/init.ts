import { Command } from "commander";
import { mkdirSync, writeFileSync, existsSync } from "fs";
import { join, resolve } from "path";
import chalk from "chalk";
import ora from "ora";
import { askInitQuestions } from "../utils/prompts.js";
import { generatePackageJson } from "../templates/package.json.js";
import { generateTsconfig } from "../templates/tsconfig.json.js";
import { generateIndexTs } from "../templates/index.ts.js";
import { generateReadme } from "../templates/readme.md.js";

export const initCommand = new Command("init")
  .description("Scaffold a new MCP server project")
  .argument("[name]", "Project name")
  .action(async (name?: string) => {
    console.log(chalk.bold("\n🔧 mcp-craft init\n"));
    console.log(chalk.dim("Let's create a new MCP server.\n"));

    // Ask questions interactively
    const answers = await askInitQuestions(name);
    const projectDir = resolve(process.cwd(), answers.name);

    // Check if directory already exists
    if (existsSync(projectDir)) {
      console.log(chalk.red(`\nError: Directory "${answers.name}" already exists.`));
      process.exit(1);
    }

    const spinner = ora("Creating project...").start();

    try {
      // Create directories
      mkdirSync(join(projectDir, "src"), { recursive: true });

      // Write files
      writeFileSync(
        join(projectDir, "package.json"),
        generatePackageJson(answers)
      );

      writeFileSync(
        join(projectDir, "tsconfig.json"),
        generateTsconfig()
      );

      writeFileSync(
        join(projectDir, "src", "index.ts"),
        generateIndexTs(answers)
      );

      writeFileSync(
        join(projectDir, "README.md"),
        generateReadme(answers)
      );

      writeFileSync(
        join(projectDir, ".gitignore"),
        ["node_modules/", "build/", "*.tsbuildinfo", ".DS_Store", ""].join("\n")
      );

      spinner.succeed("Project created!");

      // Print next steps
      console.log(chalk.bold("\n📁 Project structure:\n"));
      console.log(chalk.dim(`  ${answers.name}/`));
      console.log(chalk.dim("  ├── src/"));
      console.log(chalk.dim("  │   └── index.ts     ← your server code"));
      console.log(chalk.dim("  ├── package.json"));
      console.log(chalk.dim("  ├── tsconfig.json"));
      console.log(chalk.dim("  ├── .gitignore"));
      console.log(chalk.dim("  └── README.md"));

      console.log(chalk.bold("\n🚀 Next steps:\n"));
      console.log(chalk.cyan(`  cd ${answers.name}`));
      console.log(chalk.cyan("  npm install"));
      console.log(chalk.cyan("  npm run build"));
      console.log(chalk.cyan("  npm run inspector    # test it visually"));

      console.log(
        chalk.dim("\nTip: Use ") +
        chalk.cyan("mcp-craft add tool <name>") +
        chalk.dim(" to add more tools to your server.\n")
      );
    } catch (error) {
      spinner.fail("Failed to create project");
      console.error(chalk.red(error));
      process.exit(1);
    }
  });
