import type { ManifestOptions } from "vite-plugin-pwa";

/**
 * The installed app's identity: what it's called on a home screen, what opens
 * when it's launched, and which icons represent it.
 *
 * It lives here rather than inline in vite.config.ts so a test can check the
 * icon files it names actually exist — a wrong path fails silently, leaving a
 * blank icon or, in Chrome, no install prompt at all.
 */
export const pwaManifest: Partial<ManifestOptions> = {
  name: "Arabic Tutor",
  // Home screens truncate at roughly 12 characters.
  short_name: "Arabic Tutor",
  description:
    "Learn Modern Standard Arabic — script, vocabulary, and sentence-building — across 100 free, self-paced levels.",
  lang: "en",
  dir: "ltr",
  categories: ["education"],
  start_url: "/",
  scope: "/",
  display: "standalone",
  // The splash screen behind the icon while the app starts: parchment, as in
  // the light theme. A manifest colour can't follow the device the way the
  // theme-color meta tags in index.html do.
  background_color: "#fbf5ec",
  theme_color: "#fbf5ec",
  icons: [
    { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
    { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    // Android crops icons to its own shape, so this one is full-bleed with the
    // letter kept inside the safe circle.
    { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
  ],
};
