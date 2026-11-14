import { afterEach, describe, expect, it, vi } from "vitest";
import { $, entity, makeHass, mountCard, openTempPanel } from "./helpers";

const FAN = "fan.f";
const fan = (attributes: Record<string, unknown> = {}) =>
  entity(FAN, "on", {
    supported_features: 1 | 8 | 16 | 32,
    percentage: 50,
    preset_modes: ["normal", "sleep"],
    preset_mode: "normal",
    ...attributes,
  });

afterEach(() => {
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

const selected = (select: HTMLSelectElement) =>
  Array.from(select.options).filter((o) => o.selected).map((o) => o.value);

describe("selects (audit B5)", () => {
  // The options of the integration's timer select for a number timer.
  const PRESETS = ["off", "15 min", "30 min", "1 h", "2 h", "4 h", "8 h"];

  it("selects the timer value on the first render", async () => {
    const el = await mountCard(
      { fan_entity: FAN },
      makeHass([fan(), entity("select.f_timer", "2 h", { options: PRESETS })]),
    );
    const select = $(el, ".ctrl-select") as HTMLSelectElement;
    expect(select.value).toBe("2 h");
    expect(selected(select)).toEqual(["2 h"]);
    expect(select.classList.contains("active")).toBe(true);
  });

  it("translates the 'off' option and shows no active timer", async () => {
    const el = await mountCard(
      { fan_entity: FAN },
      makeHass([fan(), entity("select.f_timer", "off", { options: PRESETS })], "fr"),
    );
    const select = $(el, ".ctrl-select") as HTMLSelectElement;
    expect(select.selectedOptions[0].textContent?.trim()).toBe("Aucune");
    expect(select.classList.contains("active")).toBe(false);
  });

  it("keeps a value that is not an option selected", async () => {
    const el = await mountCard(
      { fan_entity: FAN },
      makeHass([fan(), entity("select.f_timer", "45 min", { options: PRESETS })]),
    );
    const select = $(el, ".ctrl-select") as HTMLSelectElement;
    expect(select.value).toBe("45 min");
  });

  it("sets the timer through the select", async () => {
    const hass = makeHass([fan(), entity("select.f_timer", "off", { options: ["off", "1h", "2h"] })]);
    const el = await mountCard({ fan_entity: FAN }, hass);
    const select = $(el, ".ctrl-select") as HTMLSelectElement;
    select.value = "1h";
    select.dispatchEvent(new Event("change"));
    expect(hass.callService).toHaveBeenCalledWith("select", "select_option", { entity_id: "select.f_timer", option: "1h" });
  });

  it("selects the current preset on the first render", async () => {
    const el = await mountCard({ fan_entity: FAN }, makeHass([fan({ preset_mode: "sleep" })]));
    const select = $(el, ".preset-select") as HTMLSelectElement;
    expect(select.value).toBe("sleep");
    expect(selected(select)).toEqual(["sleep"]);
  });

  it("shows a placeholder when no preset is active", async () => {
    const el = await mountCard({ fan_entity: FAN }, makeHass([fan({ preset_mode: null })]));
    const select = $(el, ".preset-select") as HTMLSelectElement;
    expect(select.value).toBe("");
    expect(select.selectedOptions[0].textContent).toBe("—");
  });
});

describe("service calls (audit B6, B7)", () => {
  it("logs a failed call instead of leaving an unhandled rejection", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const hass = makeHass([fan()]);
    hass.callService.mockRejectedValue(new Error("boom"));
    const el = await mountCard({ fan_entity: FAN }, hass);
    ($(el, ".speed-seg") as HTMLButtonElement).click();
    await vi.waitFor(() => expect(error).toHaveBeenCalledTimes(1));
    expect(error.mock.calls[0][0]).toBe("fan-bridge-card: fan.set_percentage failed");
  });

  it("catches a synchronous throw too", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const hass = makeHass([fan()]);
    hass.callService.mockImplementation(() => {
      throw new Error("sync");
    });
    const el = await mountCard({ fan_entity: FAN }, hass);
    ($(el, ".speed-seg") as HTMLButtonElement).click();
    expect(error).toHaveBeenCalledTimes(1);
  });

  it("puts the colour-temperature slider back when light.turn_on fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const hass = makeHass([
      fan(),
      entity("light.f", "on", {
        supported_color_modes: ["color_temp"],
        min_color_temp_kelvin: 2700,
        max_color_temp_kelvin: 6500,
        color_temp_kelvin: 3000,
      }),
    ]);
    hass.callService.mockRejectedValue(new Error("offline"));
    const el = await mountCard({ fan_entity: FAN }, hass);
    await openTempPanel(el);
    const slider = $(el, ".temp-slider") as HTMLInputElement;
    expect(slider.value).toBe("3000");
    slider.value = "5000";
    slider.dispatchEvent(new Event("change"));
    expect(hass.callService).toHaveBeenCalledWith("light", "turn_on", {
      entity_id: "light.f",
      color_temp_kelvin: 5000,
    });
    await vi.waitFor(() => expect(slider.value).toBe("3000"));
  });
});

describe("dial", () => {
  const sixSpeed = () =>
    makeHass([entity(FAN, "on", { supported_features: 1 | 16 | 32, percentage: 50, percentage_step: 100 / 6 })]);

  const tap = (el: HTMLElement, xFrac: number, yFrac: number) => {
    const hit = $(el, ".hit") as unknown as SVGGraphicsElement;
    const svg = hit.ownerSVGElement as SVGSVGElement;
    svg.getBoundingClientRect = () => ({ left: 0, top: 0, width: 300, height: 276, right: 300, bottom: 276, x: 0, y: 0, toJSON: () => ({}) });
    hit.dispatchEvent(new MouseEvent("click", { clientX: xFrac * 300, clientY: yFrac * 276, bubbles: true }));
  };

  it("sets the speed from the tapped angle", async () => {
    const hass = sixSpeed();
    const el = await mountCard({ fan_entity: FAN }, hass);
    // Right end of the arc (about 45° below the horizontal) is the top speed.
    tap(el, 0.5 + 0.28, 0.54 + 0.28);
    expect(hass.callService).toHaveBeenCalledWith("fan", "set_percentage", { entity_id: FAN, percentage: 100 });
  });

  it("keeps the colour-temperature slider collapsed until asked for", async () => {
    const hass = makeHass([
      entity(FAN, "on", { supported_features: 1 | 16 | 32, percentage: 50 }),
      entity("light.f", "on", { supported_color_modes: ["color_temp"], color_temp_kelvin: 3000 }),
    ]);
    const el = await mountCard({ fan_entity: FAN }, hass);
    expect($(el, ".temp-slider")).toBeNull();
    await openTempPanel(el);
    expect($(el, ".temp-slider")).not.toBeNull();
  });

  it("flags a merged fan that reports it runs on its backup", async () => {
    const attrs = { supported_features: 1 | 16 | 32, percentage: 50 };
    const hass = makeHass([entity("fan.m", "on", { ...attrs, using_backup: true })]);
    const el = await mountCard({ fan_entity: "fan.m" }, hass);
    expect($(el, ".badge")?.textContent?.trim()).toBe("Backup");
    const main = await mountCard({ fan_entity: "fan.m" }, makeHass([entity("fan.m", "on", { ...attrs, using_backup: false })]));
    expect($(main, ".badge")).toBeNull();
  });
});
