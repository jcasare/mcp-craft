import type { InitAnswers } from "../utils/prompts.js";

export function generatePackageJson(answers: InitAnswers): string {
  const deps: Record<string, string> = {
    "@modelcontextprotocol/sdk": "^1.12.0",
    "zod": "^3.23.0",
  };

  if (answers.transport === "http") {
    deps["express"] = "^4.21.0";
  }

  const devDeps: Record<string, string> = {
    "@types/node": "^20.14.0",
    "typescript": "^5.5.0",
  };

  if (answers.transport === "http") {
    devDeps["@types/express"] = "^4.17.21";
  }

  const pkg = {
    name: answers.name,
    version: "1.0.0",
    description: answers.description,
    type: "module",
    bin: {
      [answers.name]: "./build/index.js",
    },
    scripts: {
      build: "tsc && chmod +x build/index.js",
      dev: "tsc --watch",
      start: "node build/index.js",
      inspector: "npx @modelcontextprotocol/inspector node build/index.js",
    },
    dependencies: deps,
    devDependencies: devDeps,
    files: ["build"],
  };

  return JSON.stringify(pkg, null, 2) + "\n";
}
