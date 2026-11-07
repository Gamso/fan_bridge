import { afterEach, describe, expect, it, vi } from "vitest";
import type { HassEntity, HomeAssistant } from "../src/ha-types";
import { $, entity, makeHass, mountCard } from "./helpers";

const FAN = "fan.f";
const fan = (pct: number) =>
  entity(FAN, "on", { supported_features: 1 | 16 | 32, percentage: pct, percentage_step: 100 / 6 });

function withStates(hass: HomeAssistant, ...changes: HassEntity[]): HomeAssistant {
  const states = { ...hass.states };
  for (const e of changes) states[e.entity_id] = e;
  return { ...hass, states };
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("update filtering (audit P1)", () => {
  it("ignores state changes of unrelated entities", async () => {
    const hass = makeHass([fan(50), entity("sensor.other", "1")]);
    const el = await mountCard({ fan_entity: FAN }, hass);
    const render = vi.spyOn(el as unknown as { render(): unknown }, "render");
    el.hass = withStates(hass, entity("sensor.other", "2"));
    await el.updateComplete;
    expect(render).not.toHaveBeenCalled();
  });

  it("re-renders when the fan changes", async () => {
    const hass = makeHass([fan(50), entity("sensor.other", "1")]);
    const el = await mountCard({ fan_entity: FAN }, hass);
    el.hass = withStates(hass, fan(100));
    await el.updateComplete;
    expect($(el, ".speed-seg.active")?.textContent?.trim()).toBe("6");
  });

  it("re-renders when a tracked related entity changes", async () => {
    const hass = makeHass([fan(50), entity("light.f", "off")]);
    const el = await mountCard({ fan_entity: FAN }, hass);
    expect($(el, ".ctrl-btn.light")?.classList.contains("on")).toBe(false);
    el.hass = withStates(hass, entity("light.f", "on"));
    await el.updateComplete;
    expect($(el, ".ctrl-btn.light")?.classList.contains("on")).toBe(true);
  });

  it("discovers an entity added after the first render", async () => {
    const hass = makeHass([fan(50)]);
    const el = await mountCard({ fan_entity: FAN }, hass);
    expect($(el, ".ctrl-btn.light")).toBeNull();
    el.hass = withStates(hass, entity("light.f", "on"));
    await el.updateComplete;
    expect($(el, ".ctrl-btn.light")).not.toBeNull();
  });

  it("re-renders on a language change", async () => {
    const hass = makeHass([fan(50)]);
    const el = await mountCard({ fan_entity: FAN }, hass);
    el.hass = { ...hass, language: "fr", locale: { language: "fr" } };
    await el.updateComplete;
    expect($(el, ".fan-state")?.textContent?.trim()).toBe("Vitesse 3 — Modéré");
  });
});
