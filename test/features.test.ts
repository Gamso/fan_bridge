import { afterEach, describe, expect, it } from "vitest";
import { FanFeature, fanSupports } from "../src/types";
import { $, $$, entity, makeHass, mountCard } from "./helpers";

const FAN = "fan.f";
const { SET_SPEED, OSCILLATE, DIRECTION, PRESET_MODE, TURN_OFF, TURN_ON } = FanFeature;

function fan(state: string, features: number, attributes: Record<string, unknown> = {}) {
  return entity(FAN, state, { supported_features: features, ...attributes });
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("FanFeature", () => {
  it("matches homeassistant.components.fan.FanEntityFeature", () => {
    expect(FanFeature).toEqual({
      SET_SPEED: 1,
      OSCILLATE: 2,
      DIRECTION: 4,
      PRESET_MODE: 8,
      TURN_OFF: 16,
      TURN_ON: 32,
    });
  });

  it("reads supported_features bits", () => {
    expect(fanSupports(fan("on", 1 | 32), SET_SPEED)).toBe(true);
    expect(fanSupports(fan("on", 1 | 32), TURN_OFF)).toBe(false);
    expect(fanSupports(undefined, SET_SPEED)).toBe(false);
  });
});

describe("controls gated by supported_features", () => {
  it("hides the speed bar without SET_SPEED and shows plain on/off", async () => {
    const el = await mountCard({ fan_entity: FAN }, makeHass([fan("on", TURN_ON | TURN_OFF)]));
    expect($(el, ".speed-bar")).toBeNull();
    expect($(el, ".fan-state")?.textContent?.trim()).toBe("On");
    expect($(el, ".fan-pct")).toBeNull();
    expect($(el, ".fan-svg")?.getAttribute("style")).toContain("animation: spin");
    expect($(el, ".ctrl-btn.power")).not.toBeNull();
  });

  it("shows the speed bar with SET_SPEED", async () => {
    const el = await mountCard(
      { fan_entity: FAN },
      makeHass([fan("on", SET_SPEED | TURN_ON | TURN_OFF, { percentage: 50 })]),
    );
    expect($$(el, ".speed-seg")).toHaveLength(6);
  });

  it("hides the power button when neither TURN_ON nor TURN_OFF is supported", async () => {
    const el = await mountCard({ fan_entity: FAN }, makeHass([fan("on", SET_SPEED)]));
    expect($(el, ".ctrl-btn.power")).toBeNull();
  });

  it("disables power when the fan is on but cannot be turned off", async () => {
    const el = await mountCard({ fan_entity: FAN }, makeHass([fan("on", TURN_ON)]));
    expect(($(el, ".ctrl-btn.power") as HTMLButtonElement).disabled).toBe(true);
  });

  it("enables power to turn on a fan that only supports TURN_ON", async () => {
    const hass = makeHass([fan("off", TURN_ON)]);
    const el = await mountCard({ fan_entity: FAN }, hass);
    const power = $(el, ".ctrl-btn.power") as HTMLButtonElement;
    expect(power.disabled).toBe(false);
    power.click();
    expect(hass.callService).toHaveBeenCalledWith("fan", "turn_on", { entity_id: FAN });
  });

  it("shows an oscillate toggle with OSCILLATE", async () => {
    const hass = makeHass([fan("on", OSCILLATE | TURN_OFF, { oscillating: false })]);
    const el = await mountCard({ fan_entity: FAN }, hass);
    const btn = $(el, ".ctrl-btn.oscillate") as HTMLButtonElement;
    expect(btn).not.toBeNull();
    expect(btn.getAttribute("aria-pressed")).toBe("false");
    btn.click();
    expect(hass.callService).toHaveBeenCalledWith("fan", "oscillate", {
      entity_id: FAN,
      oscillating: true,
    });
  });

  it("marks the oscillate toggle active and turns it off", async () => {
    const hass = makeHass([fan("on", OSCILLATE, { oscillating: true })]);
    const el = await mountCard({ fan_entity: FAN }, hass);
    const btn = $(el, ".ctrl-btn.oscillate") as HTMLButtonElement;
    expect(btn.classList.contains("on")).toBe(true);
    btn.click();
    expect(hass.callService).toHaveBeenCalledWith("fan", "oscillate", {
      entity_id: FAN,
      oscillating: false,
    });
  });

  it("has no oscillate toggle without OSCILLATE", async () => {
    const el = await mountCard({ fan_entity: FAN }, makeHass([fan("on", SET_SPEED)]));
    expect($(el, ".ctrl-btn.oscillate")).toBeNull();
  });

  it("gates season toggle and presets on DIRECTION and PRESET_MODE", async () => {
    const none = await mountCard(
      { fan_entity: FAN },
      makeHass([fan("on", SET_SPEED, { preset_modes: ["sleep"] })]),
    );
    expect($(none, ".season-toggle")).toBeNull();
    expect($(none, ".preset-select")).toBeNull();
    const all = await mountCard(
      { fan_entity: FAN },
      makeHass([fan("on", SET_SPEED | DIRECTION | PRESET_MODE, { preset_modes: ["sleep"] })]),
    );
    expect($(all, ".season-toggle")).not.toBeNull();
    expect($(all, ".preset-select")).not.toBeNull();
  });
});
