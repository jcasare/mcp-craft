import inquirer from "inquirer";

export interface InitAnswers {
  name: string;
  description: string;
  transport: "stdio" | "http";
  features: ("tools" | "resources" | "prompts")[];
}

export async function askInitQuestions(defaultName?: string): Promise<InitAnswers> {
  const answers = await inquirer.prompt([
    {
      type: "input",
      name: "name",
      message: "Project name:",
      default: defaultName || "my-mcp-server",
      validate: (input: string) => {
        if (!/^[a-z0-9-]+$/.test(input)) {
          return "Use lowercase letters, numbers, and hyphens only";
        }
        return true;
      },
    },
    {
      type: "input",
      name: "description",
      message: "Description:",
      default: "An MCP server",
    },
    {
      type: "list",
      name: "transport",
      message: "Transport type:",
      choices: [
        { name: "stdio (local subprocess — most common)", value: "stdio" },
        { name: "HTTP (remote server)", value: "http" },
      ],
      default: "stdio",
    },
    {
      type: "checkbox",
      name: "features",
      message: "What should your server expose?",
      choices: [
        { name: "Tools (functions the AI can call)", value: "tools", checked: true },
        { name: "Resources (data the AI can read)", value: "resources" },
        { name: "Prompts (reusable message templates)", value: "prompts" },
      ],
    },
  ]);

  return answers;
}
