#!/usr/bin/env node
import { Command } from "commander";
import { initCommand } from "./commands/init.js";
import { addCommand } from "./commands/add.js";
import { testCommand } from "./commands/test.js";
import { inspectCommand } from "./commands/inspect.js";
import { registerCommand } from "./commands/register.js";

const program = new Command();

program
  .name("mcp-craft")
  .description("CLI toolkit for scaffolding, testing, and managing MCP servers")
  .version("0.1.0");

program.addCommand(initCommand);
program.addCommand(addCommand);
program.addCommand(testCommand);
program.addCommand(inspectCommand);
program.addCommand(registerCommand);

program.parse();
