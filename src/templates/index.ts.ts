import type { InitAnswers } from "../utils/prompts.js";

export function generateIndexTs(answers: InitAnswers): string {
  const lines: string[] = [];

  // Shebang and imports
  lines.push(`#!/usr/bin/env node`);
  lines.push(`import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";`);

  if (answers.transport === "stdio") {
    lines.push(`import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";`);
  } else {
    lines.push(`import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";`);
    lines.push(`import express from "express";`);
  }

  lines.push(`import { z } from "zod";`);
  lines.push(``);

  // Server instance
  lines.push(`// Create the MCP server`);
  lines.push(`// This is the core object that holds all your tools, resources, and prompts.`);
  lines.push(`const server = new McpServer({`);
  lines.push(`  name: "${answers.name}",`);
  lines.push(`  version: "1.0.0",`);
  lines.push(`});`);
  lines.push(``);

  // Tools
  if (answers.features.includes("tools")) {
    lines.push(`// ============================================================`);
    lines.push(`// TOOLS`);
    lines.push(`// Tools are functions that the AI can call to perform actions.`);
    lines.push(`// Think of them like API endpoints the AI can invoke.`);
    lines.push(`// ============================================================`);
    lines.push(``);
    lines.push(`server.tool(`);
    lines.push(`  // Tool name — the AI uses this to identify and call the tool`);
    lines.push(`  "hello",`);
    lines.push(`  // Description — helps the AI understand when to use this tool`);
    lines.push(`  "Say hello to someone",`);
    lines.push(`  // Input schema — defines what parameters the tool accepts`);
    lines.push(`  // Uses Zod for validation (like TypeScript types but at runtime)`);
    lines.push(`  {`);
    lines.push(`    name: z.string().describe("The name to greet"),`);
    lines.push(`  },`);
    lines.push(`  // Handler — runs when the AI calls this tool`);
    lines.push(`  async ({ name }) => {`);
    lines.push(`    return {`);
    lines.push(`      content: [{ type: "text", text: \`Hello, \${name}! Welcome to MCP.\` }],`);
    lines.push(`    };`);
    lines.push(`  }`);
    lines.push(`);`);
    lines.push(``);
  }

  // Resources
  if (answers.features.includes("resources")) {
    lines.push(`// ============================================================`);
    lines.push(`// RESOURCES`);
    lines.push(`// Resources are data sources the AI can read for context.`);
    lines.push(`// They're like GET endpoints — read-only data the AI can access.`);
    lines.push(`// ============================================================`);
    lines.push(``);
    lines.push(`server.resource(`);
    lines.push(`  // Resource name — internal identifier`);
    lines.push(`  "server-info",`);
    lines.push(`  // URI — unique address for this resource`);
    lines.push(`  "info://server",`);
    lines.push(`  // Metadata — helps the AI understand what this resource contains`);
    lines.push(`  // Note: "name" is already the first argument, so metadata only has description/mimeType`);
    lines.push(`  {`);
    lines.push(`    description: "Information about this MCP server",`);
    lines.push(`    mimeType: "application/json",`);
    lines.push(`  },`);
    lines.push(`  // Handler — returns the resource content when requested`);
    lines.push(`  async (uri: URL) => ({`);
    lines.push(`    contents: [`);
    lines.push(`      {`);
    lines.push(`        uri: uri.href,`);
    lines.push(`        mimeType: "application/json",`);
    lines.push(`        text: JSON.stringify({`);
    lines.push(`          name: "${answers.name}",`);
    lines.push(`          version: "1.0.0",`);
    lines.push(`          status: "running",`);
    lines.push(`        }, null, 2),`);
    lines.push(`      },`);
    lines.push(`    ],`);
    lines.push(`  })`);
    lines.push(`);`);
    lines.push(``);
  }

  // Prompts
  if (answers.features.includes("prompts")) {
    lines.push(`// ============================================================`);
    lines.push(`// PROMPTS`);
    lines.push(`// Prompts are reusable message templates that users can select.`);
    lines.push(`// They appear as slash commands or menu items in the AI client.`);
    lines.push(`// ============================================================`);
    lines.push(``);
    lines.push(`server.prompt(`);
    lines.push(`  // Prompt name — shown to the user as a selectable option`);
    lines.push(`  "review",`);
    lines.push(`  // Description — explains what this prompt does`);
    lines.push(`  "Review code for quality and improvements",`);
    lines.push(`  // Arguments — parameters the user fills in when using the prompt`);
    lines.push(`  {`);
    lines.push(`    code: z.string().describe("The code to review"),`);
    lines.push(`  },`);
    lines.push(`  // Handler — generates the message(s) to send to the AI`);
    lines.push(`  ({ code }) => ({`);
    lines.push(`    messages: [`);
    lines.push(`      {`);
    lines.push(`        role: "user" as const,`);
    lines.push(`        content: {`);
    lines.push(`          type: "text" as const,`);
    lines.push(`          text: \`Please review this code for quality, bugs, and improvements:\\n\\n\${code}\`,`);
    lines.push(`        },`);
    lines.push(`      },`);
    lines.push(`    ],`);
    lines.push(`  })`);
    lines.push(`);`);
    lines.push(``);
  }

  // Server startup
  lines.push(`// ============================================================`);
  lines.push(`// START THE SERVER`);
  lines.push(`// ============================================================`);
  lines.push(``);

  if (answers.transport === "stdio") {
    lines.push(`// stdio transport — the AI app launches this as a subprocess`);
    lines.push(`// and communicates through stdin/stdout (like a pipe).`);
    lines.push(`// IMPORTANT: Never use console.log() in stdio servers!`);
    lines.push(`// It would corrupt the JSON-RPC stream. Use console.error() instead.`);
    lines.push(`async function main() {`);
    lines.push(`  const transport = new StdioServerTransport();`);
    lines.push(`  await server.connect(transport);`);
    lines.push(`  console.error("${answers.name} MCP server running on stdio");`);
    lines.push(`}`);
    lines.push(``);
    lines.push(`main().catch((error) => {`);
    lines.push(`  console.error("Fatal error:", error);`);
    lines.push(`  process.exit(1);`);
    lines.push(`});`);
  } else {
    lines.push(`// HTTP transport — the server runs independently on a port`);
    lines.push(`// and the AI app sends requests to it over HTTP.`);
    lines.push(`const app = express();`);
    lines.push(`app.use(express.json());`);
    lines.push(``);
    lines.push(`app.all("/mcp", async (req, res) => {`);
    lines.push(`  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });`);
    lines.push(`  await server.connect(transport);`);
    lines.push(`  await transport.handleRequest(req, res, req.body);`);
    lines.push(`});`);
    lines.push(``);
    lines.push(`const PORT = process.env.PORT || 3000;`);
    lines.push(`app.listen(PORT, () => {`);
    lines.push(`  console.log(\`${answers.name} MCP server running on http://localhost:\${PORT}/mcp\`);`);
    lines.push(`});`);
  }

  lines.push(``);

  return lines.join("\n");
}
