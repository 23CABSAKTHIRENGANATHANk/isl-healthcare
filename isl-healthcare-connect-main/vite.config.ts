import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
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
    tanstackStart({
      server: { entry: "server" },
    }),
    viteReact(),
    tailwindcss(),
  ],
});
