import type { InitAnswers } from "../utils/prompts.js";

export function generateReadme(answers: InitAnswers): string {
  const features = answers.features
    .map((f) => {
      if (f === "tools") return "Tools (functions the AI can call)";
      if (f === "resources") return "Resources (data the AI can read)";
      return "Prompts (reusable message templates)";
    })
    .map((f) => `- ${f}`)
    .join("\n");

  const transport =
    answers.transport === "stdio"
      ? "stdio (local subprocess)"
      : "HTTP (remote server)";

  return `# ${answers.name}

${answers.description}

## Setup

\`\`\`bash
npm install
npm run build
\`\`\`

## Usage

${answers.transport === "stdio" ? `### Run directly
\`\`\`bash
node build/index.js
\`\`\`

### Register with Claude Desktop

Add to \`~/Library/Application Support/Claude/claude_desktop_config.json\`:

\`\`\`json
{
  "mcpServers": {
    "${answers.name}": {
      "command": "node",
      "args": ["${process.cwd()}/${answers.name}/build/index.js"]
    }
  }
}
\`\`\`

### Register with Claude Code

\`\`\`bash
claude mcp add ${answers.name} node build/index.js
\`\`\`` : `### Start the server
\`\`\`bash
npm start
\`\`\`

The server will be available at \`http://localhost:3000/mcp\`.`}

### Test with MCP Inspector

\`\`\`bash
npm run inspector
\`\`\`

## Features

Transport: ${transport}

${features}

## Development

\`\`\`bash
npm run dev    # Watch mode — recompiles on changes
npm run build  # One-time build
\`\`\`

---

Built with [mcp-craft](https://github.com/mcp-craft/mcp-craft)
`;
}
