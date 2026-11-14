import { describe, expect, it } from "vitest";
import manifest from "../custom_components/fan_bridge/manifest.json";
import pkg from "../package.json";
import { CARD_VERSION } from "../src/version";

describe("version", () => {
  it("matches package.json", () => {
    expect(CARD_VERSION).toBe(pkg.version);
  });

  it("matches the integration's manifest, which versions the bundle URL", () => {
    expect(CARD_VERSION).toBe(manifest.version);
  });
});
