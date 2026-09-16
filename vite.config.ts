import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { pwaManifest } from "./src/lib/pwaManifest";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // "prompt", not "autoUpdate": a new deploy must never reload the page
      // out from under someone mid-exercise. UpdatePrompt offers the reload.
      registerType: "prompt",
      manifest: pwaManifest,
      // The globs below already match every icon, so neither includeAssets nor
      // the manifest icons should be added again: that listed six files twice.
      includeManifestIcons: false,
      workbox: {
        // The whole course ships inside the JS bundle, so precaching the build
        // is all offline needs — there is no content API to work around.
        globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
        // Every in-app URL (/level/58, /glossary, …) is served by index.html,
        // the same job vercel.json's rewrite does when online.
        navigateFallback: "/index.html",
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            // The stylesheet naming the font files; revalidated in the
            // background so a font update is picked up on a later visit.
            urlPattern: /^https:\/\/fonts\.googleapis\.com\//,
            handler: "StaleWhileRevalidate",
            options: { cacheName: "google-fonts-stylesheets" },
          },
          {
            // The font files themselves. Without these, Arabic offline falls
            // back to whatever the device has instead of Noto Naskh Arabic —
            // which changes the shape of the script learners are reading.
            urlPattern: /^https:\/\/fonts\.gstatic\.com\//,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-files",
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],

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
