import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  base: "/red-box-software.com/",
  build: {
    outDir: "dist",
    assetsDir: "assets",
    rollupOptions: {
      output: {
        // Ensure proper JavaScript file extensions
        entryFileNames: "assets/[name]-[hash].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]",
      },
    },
  },
  // Ensure proper JSX handling
  esbuild: {
    jsxInject: `import React from 'react'`,
    loader: "jsx",
  },
  // Ensure proper file resolution
  resolve: {
    extensions: [".js", ".jsx", ".json"],
  },
});
