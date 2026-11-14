import { afterEach, describe, expect, it } from "vitest";
import { $, entity, makeHass, mountCard, openLightPanel } from "./helpers";

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

describe("light panel", () => {
  it("sets the brightness in percent", async () => {
    const hass = makeHass([
      fan("on"),
      entity("light.f", "on", { supported_color_modes: ["brightness"], brightness: 128 }),
    ]);
    const el = await mountCard({ fan_entity: FAN }, hass);
    await openLightPanel(el);
    expect($(el, ".temp-slider")).toBeNull();
    const bright = $(el, ".bright-slider") as HTMLInputElement;
    expect(bright.value).toBe("50");
    bright.value = "80";
    bright.dispatchEvent(new Event("change"));
    expect(hass.callService).toHaveBeenCalledWith("light", "turn_on", { entity_id: "light.f", brightness_pct: 80 });
  });

  it("shows both sliders for a colour-temperature light", async () => {
    const el = await mountCard({ fan_entity: FAN }, makeHass([fan("on"), light()]));
    await openLightPanel(el);
    expect($(el, ".bright-slider")).not.toBeNull();
    expect($(el, ".temp-slider")).not.toBeNull();
  });

  it("has no panel for an on/off light", async () => {
    const el = await mountCard(
      { fan_entity: FAN },
      makeHass([fan("on"), entity("light.f", "on", { supported_color_modes: ["onoff"] })]),
    );
    expect($(el, ".light-toggle")).toBeNull();
  });
});

describe("light_independent (audit A3)", () => {
  it("defaults to a light locked while the fan is off", async () => {
    const el = await mountCard({ fan_entity: FAN }, makeHass([fan("off"), light()]));
    expect(lightBtn(el).disabled).toBe(true);
    // Unchanged default: the slider only follows the fan's availability.
    await openLightPanel(el);
    expect(slider(el).disabled).toBe(false);
  });

  it("keeps the light usable while the fan is off when independent", async () => {
    const hass = makeHass([fan("off"), light()]);
    const el = await mountCard({ fan_entity: FAN, light_independent: true }, hass);
    expect(lightBtn(el).disabled).toBe(false);
    await openLightPanel(el);
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
