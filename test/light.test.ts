import { afterEach, describe, expect, it } from "vitest";
import { $, entity, makeHass, mountCard, openTempPanel } from "./helpers";

const FAN = "fan.f";
const fan = (state: string) => entity(FAN, state, { supported_features: 1 | 16 | 32, percentage: 0 });
const light = (state = "on") =>
  entity("light.f", state, {
    supported_color_modes: ["color_temp"],
    color_temp_kelvin: 3000,
  });

afterEach(() => {
  document.body.innerHTML = "";
});

const lightBtn = (el: HTMLElement) => $(el, ".ctrl-btn.light") as HTMLButtonElement;
const slider = (el: HTMLElement) => $(el, ".temp-slider") as HTMLInputElement;

describe("light_independent (audit A3)", () => {
  it("defaults to a light locked while the fan is off", async () => {
    const el = await mountCard({ fan_entity: FAN }, makeHass([fan("off"), light()]));
    expect(lightBtn(el).disabled).toBe(true);
    // Unchanged default: the slider only follows the fan's availability.
    await openTempPanel(el);
    expect(slider(el).disabled).toBe(false);
  });

  it("keeps the light usable while the fan is off when independent", async () => {
    const hass = makeHass([fan("off"), light()]);
    const el = await mountCard({ fan_entity: FAN, light_independent: true }, hass);
    expect(lightBtn(el).disabled).toBe(false);
    await openTempPanel(el);
    expect(slider(el).disabled).toBe(false);
    lightBtn(el).click();
    expect(hass.callService).toHaveBeenCalledWith("light", "toggle", { entity_id: "light.f" });
  });

  it("still disables an independent light that is itself unavailable", async () => {
    const el = await mountCard(
      { fan_entity: FAN, light_independent: true },
      makeHass([fan("on"), light("unavailable")]),
    );
    expect(lightBtn(el).disabled).toBe(true);
  });
});
