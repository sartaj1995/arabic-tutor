import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  // The 100 level files are the bulk of the bundle (~419 KB of JSON). Emitting
  // them as JSON.parse("...") rather than inline object literals is both
  // smaller over the wire once gzipped and materially faster for the engine to
  // parse — JSON.parse has a dedicated fast path that large object literals
  // don't get.
  json: {
    stringify: true,
  },

  build: {
    rollupOptions: {
      output: {
        // Split the dependencies out from app + content. They change on almost
        // no deploy, while content/app code changes on most of them, so a
        // returning visitor re-downloads only the smaller half.
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom", "dexie"],
        },
      },
    },
  },
});
