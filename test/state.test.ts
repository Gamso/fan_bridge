import { afterEach, describe, expect, it } from "vitest";
import { isFanOn, isFanUnavailable } from "../src/types";
import { $, $$, entity, makeHass, mountCard } from "./helpers";

const FAN = "fan.f";

function fan(state: string) {
  return entity(FAN, state, {
    supported_features: 1 | 8 | 16 | 32,
    percentage: 50,
    preset_modes: ["normal", "sleep"],
    preset_mode: "sleep",
  });
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("off-like states", () => {
  it.each([
    ["on", true, false],
    ["off", false, false],
    ["unknown", false, true],
    ["unavailable", false, true],
  ])("%s: on=%s unavailable=%s", (state, on, unavailable) => {
    expect(isFanOn(entity(FAN, state))).toBe(on);
    expect(isFanUnavailable(entity(FAN, state))).toBe(unavailable);
  });

  it("treats a missing entity as off", () => {
    expect(isFanOn(undefined)).toBe(false);
  });

  it("renders an unknown fan as off and not controllable", async () => {
    const hass = makeHass([
      fan("unknown"),
      entity("light.f", "off"),
      entity("switch.f_sound", "off"),
    ]);
    const el = await mountCard({ fan_entity: FAN }, hass);
    expect($(el, ".ctrl-btn.power")?.classList.contains("on")).toBe(false);
    expect(($(el, ".ctrl-btn.power") as HTMLButtonElement).disabled).toBe(true);
    expect($(el, ".speed-seg.active")).toBeNull();
    expect($$(el, ".speed-seg").every((b) => (b as HTMLButtonElement).disabled)).toBe(true);
    expect(($(el, ".preset-select") as HTMLSelectElement).disabled).toBe(true);
    expect($(el, ".fan-pct")?.textContent?.trim()).toBe("—");
    expect($(el, ".unavailable-msg")).not.toBeNull();
    expect($(el, ".fan-svg")?.getAttribute("style")).toBe("");
  });
});
