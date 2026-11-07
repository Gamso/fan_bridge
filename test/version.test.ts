import { describe, expect, it } from "vitest";
import pkg from "../package.json";
import { CARD_VERSION } from "../src/version";

describe("version", () => {
  it("matches package.json", () => {
    expect(CARD_VERSION).toBe(pkg.version);
  });
});
