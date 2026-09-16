import { describe, expect, it } from "vitest";
import indexHtml from "../../index.html?raw";
import { pwaManifest } from "./pwaManifest";
import { THEME_COLORS } from "./settings";

/**
 * A manifest that names a missing icon fails quietly: no error, just a blank
 * icon, and in Chrome no install prompt at all. Everything in public/ is
 * served from the site root, which is how the manifest refers to them.
 */
const publicFiles = Object.keys(import.meta.glob("../../public/*")).map(
  (path) => "/" + path.split("/").pop(),
);

describe("pwa manifest", () => {
  it("names icons that exist in public/", () => {
    const icons = pwaManifest.icons ?? [];
    expect(icons.length).toBeGreaterThan(0);
    for (const icon of icons) expect(publicFiles, icon.src).toContain(icon.src);
  });

  it("offers the sizes an install prompt needs, and one Android can crop", () => {
    const icons = pwaManifest.icons ?? [];
    expect(icons.map((i) => i.sizes)).toEqual(expect.arrayContaining(["192x192", "512x512"]));
    expect(icons.some((i) => i.purpose === "maskable")).toBe(true);
  });

  it("launches into the app rather than a random page", () => {
    expect(pwaManifest.start_url).toBe("/");
    expect(pwaManifest.scope).toBe("/");
    expect(pwaManifest.display).toBe("standalone");
  });

  it("uses the light theme's background, matching the tag index.html starts with", () => {
    expect(pwaManifest.background_color).toBe(THEME_COLORS.light);
    expect(pwaManifest.theme_color).toBe(THEME_COLORS.light);
    expect(indexHtml).toContain(`<meta name="theme-color" content="${THEME_COLORS.light}" />`);
  });
});
