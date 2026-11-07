import { afterEach, describe, expect, it } from "vitest";
import { $, $$, entity, makeHass, mountCard } from "./helpers";

const FAN = "fan.ceiling_fan_with_light";

function fanState(state = "on", attributes: Record<string, unknown> = {}) {
  return entity(FAN, state, {
    friendly_name: "Windcalm",
    percentage: 50,
    percentage_step: 100 / 6,
    supported_features: 1 | 4 | 16 | 32,
    direction: "forward",
    ...attributes,
  });
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("fan-bridge-card render", () => {
  it("renders six speed segments for a 6-speed fan", async () => {
    const el = await mountCard({ fan_entity: FAN }, makeHass([fanState()]));
    expect($$(el, ".speed-seg")).toHaveLength(6);
    expect($(el, ".speed-seg.active")?.textContent?.trim()).toBe("3");
    expect($(el, ".fan-state")?.textContent?.trim()).toBe("Speed 3 — Moderate");
    expect($(el, ".fan-pct")?.textContent?.trim()).toBe("50%");
  });

  it("keeps the named 6-speed labels", async () => {
    const el = await mountCard({ fan_entity: FAN }, makeHass([fanState()]));
    expect($$(el, ".speed-seg").map((b) => b.getAttribute("aria-label"))).toEqual([
      "Gentle",
      "Soft",
      "Moderate",
      "Normal",
      "Strong",
      "Turbo",
    ]);
  });

  it("falls back to 6 segments without percentage_step", async () => {
    const el = await mountCard(
      { fan_entity: FAN },
      makeHass([fanState("on", { percentage_step: undefined })]),
    );
    expect($$(el, ".speed-seg")).toHaveLength(6);
  });

  it("sends speed 4 of 6 as HA's speed-4 boundary", async () => {
    const hass = makeHass([fanState()]);
    const el = await mountCard({ fan_entity: FAN }, hass);
    $$(el, ".speed-seg")[3].click();
    expect(hass.callService).toHaveBeenCalledWith("fan", "set_percentage", {
      entity_id: FAN,
      percentage: 66,
    });
  });

  it("renders three numbered segments for a 3-speed fan", async () => {
    const hass = makeHass([fanState("on", { percentage: 66, percentage_step: 100 / 3 })]);
    const el = await mountCard({ fan_entity: FAN }, hass);
    const segs = $$(el, ".speed-seg");
    expect(segs).toHaveLength(3);
    expect(segs.map((b) => b.getAttribute("aria-label"))).toEqual(["Speed 1", "Speed 2", "Speed 3"]);
    expect($(el, ".speed-seg.active")?.textContent?.trim()).toBe("2");
    expect($(el, ".fan-state")?.textContent?.trim()).toBe("Speed 2");
    expect($(el, ".fan-pct")?.textContent?.trim()).toBe("67%");
    segs[1].click();
    expect(hass.callService).toHaveBeenCalledWith("fan", "set_percentage", {
      entity_id: FAN,
      percentage: 66,
    });
  });

  it("renders four segments for a 4-speed fan", async () => {
    const hass = makeHass([fanState("on", { percentage: 75, percentage_step: 25 })]);
    const el = await mountCard({ fan_entity: FAN }, hass);
    expect($$(el, ".speed-seg")).toHaveLength(4);
    expect($(el, ".speed-seg.active")?.textContent?.trim()).toBe("3");
    $$(el, ".speed-seg")[3].click();
    expect(hass.callService).toHaveBeenCalledWith("fan", "set_percentage", {
      entity_id: FAN,
      percentage: 100,
    });
  });

  it("uses French numbered labels", async () => {
    const hass = makeHass([fanState("on", { percentage_step: 25 })], "fr");
    const el = await mountCard({ fan_entity: FAN }, hass);
    expect($$(el, ".speed-seg")[0].getAttribute("aria-label")).toBe("Vitesse 1");
  });
});
