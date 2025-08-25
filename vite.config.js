import { defineConfig } from "vite";

export default defineConfig({
  server: {
    fs: {
      allow: [".."],
    },
    watch: {
      ignored: ["!**/dist/**"],
    },
  },
  optimizeDeps: {
    exclude: [
      "../dist/p5-svg-loader.esm.js",
      "../dist/p5-svg-loader.js",
      "../dist/p5-svg-loader.min.js",
    ],
  },
});
