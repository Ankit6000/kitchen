import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import viteTsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(() => {
  const isGitHubActions = process.env.GITHUB_ACTIONS === "true";

  return {
    base: isGitHubActions ? "/kitchen/" : "/",
    build: {
      outDir: "build",
    },
    plugins: [react(), viteTsconfigPaths()],
    server: {
      host: "127.0.0.1",
    },
  };
});
