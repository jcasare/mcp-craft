export function generateTsconfig(): string {
  const config = {
    compilerOptions: {
      target: "ES2022",
      module: "Node16",
      moduleResolution: "Node16",
      outDir: "./build",
      rootDir: "./src",
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,
    },
    include: ["src/**/*"],
    exclude: ["node_modules"],
  };

  return JSON.stringify(config, null, 2) + "\n";
}
