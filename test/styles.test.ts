import { describe, expect, it } from "vitest";
import "../src/fan-bridge-card";

type Styled = { styles: { cssText: string } };
const css = (customElements.get("fan-bridge-card") as unknown as Styled).styles.cssText;

describe("styles (audit A4, A5)", () => {
  it("uses hex colours only as theme-variable fallbacks or in the colour-temperature gradient", () => {
    const stripped = css
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/var\(--[\w-]+,\s*#[0-9a-f]{3,8}\)/gi, "")
      .replace(/linear-gradient\([^;]*\);/g, "");
    expect(stripped.match(/#[0-9a-f]{3,8}\b/gi)).toBeNull();
  });

  it("lets the accent be themed and takes text colours from the HA theme", () => {
    expect(css).toContain("var(--fan-bridge-card-accent");
    expect(css).toContain("var(--primary-text-color)");
  });

  it("stops the spin for users who prefer reduced motion", () => {
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)\s*\{\s*\.fan-svg\s*\{\s*animation: none !important;/);
  });

  it("shows a focus ring on the slider and buttons", () => {
    expect(css).toMatch(/button:focus-visible,\s*\.temp-slider:focus-visible\s*\{\s*outline:/);
  });
});
