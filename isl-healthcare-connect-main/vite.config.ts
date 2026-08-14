import { defineConfig } from "vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  server: {
    watch: {
      ignored: [
        "**/sign dataset/**",
        "**/dataset viedo/**",
        "**/Sample Videos/**",
        "**/backend/**",
        "**/*.csv",
        "**/*.mp4",
      ],
    },
  },
  build: {
    outDir: "dist",
    rollupOptions: {
      output: {
        manualChunks: (id: string): string | undefined => {
          if (id.includes("node_modules/recharts")) {
            return "recharts";
          }
          if (id.includes("node_modules/@radix-ui")) {
            return "radix";
          }
          return undefined;
        },
      },
    },
  },
  plugins: [
    tsConfigPaths(),
    tanstackRouter({
      routesDirectory: "./src/routes",
      generatedRouteTree: "./src/routeTree.gen.ts",
    }),
    viteReact(),
    tailwindcss(),
  ],
});

