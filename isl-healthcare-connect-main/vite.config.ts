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
    target: "es2020",
    minify: "esbuild",
    cssMinify: true,
    cssCodeSplit: true,
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks: (id: string): string | undefined => {
          if (id.includes("node_modules/@mediapipe/tasks-vision")) {
            return "vendor-mediapipe";
          }
          if (id.includes("node_modules/recharts") || id.includes("node_modules/d3")) {
            return "vendor-charts";
          }
          if (id.includes("node_modules/@radix-ui")) {
            return "vendor-radix";
          }
          if (
            id.includes("node_modules/react") ||
            id.includes("node_modules/react-dom") ||
            id.includes("node_modules/@tanstack")
          ) {
            return "vendor-framework";
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
