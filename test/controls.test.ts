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
  it("selects the timer value on the first render", async () => {
    const el = await mountCard(
      { fan_entity: FAN },
      makeHass([fan(), entity("number.f_minuteur", "120.0")]),
    );
    const select = $(el, ".ctrl-select") as HTMLSelectElement;
    expect(select.value).toBe("120");
    expect(selected(select)).toEqual(["120"]);
  });

  it("shows a timer value outside the presets instead of 'None'", async () => {
    const el = await mountCard(
      { fan_entity: FAN },
      makeHass([fan(), entity("number.f_minuteur", "45")]),
    );
    const select = $(el, ".ctrl-select") as HTMLSelectElement;
    expect(select.value).toBe("45");
    expect(select.selectedOptions[0].textContent?.trim()).toBe("45 min");
    expect(Array.from(select.options).map((o) => o.value)).toEqual([
      "0", "15", "30", "45", "60", "120", "240", "480",
    ]);
    expect(select.classList.contains("active")).toBe(true);
  });

  it("uses the select entity's own options (Klassfan)", async () => {
    const el = await mountCard(
      { fan_entity: FAN },
      makeHass([fan(), entity("select.f_minuteur", "2h", { options: ["off", "1h", "2h"] })]),
    );
    const select = $(el, ".ctrl-select") as HTMLSelectElement;
    expect(select.value).toBe("2h");
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

  const pointer = (el: HTMLElement, type: string, xFrac: number, yFrac: number) => {
    const hit = $(el, ".hit") as unknown as SVGGraphicsElement;
    const svg = hit.ownerSVGElement as SVGSVGElement;
    svg.getBoundingClientRect = () => ({ left: 0, top: 0, width: 300, height: 276, right: 300, bottom: 276, x: 0, y: 0, toJSON: () => ({}) });
    hit.dispatchEvent(new MouseEvent(type, { clientX: xFrac * 300, clientY: yFrac * 276, bubbles: true }));
  };
  // Right end of the arc (about 45° below the horizontal) is the top speed,
  // left end the first one.
  const RIGHT_END = [0.5 + 0.28, 0.54 + 0.28] as const;
  const LEFT_END = [0.5 - 0.28, 0.54 + 0.28] as const;

  it("sets the speed from the tapped angle", async () => {
    const hass = sixSpeed();
    const el = await mountCard({ fan_entity: FAN }, hass);
    pointer(el, "pointerdown", ...RIGHT_END);
    pointer(el, "pointerup", ...RIGHT_END);
    expect(hass.callService).toHaveBeenCalledTimes(1);
    expect(hass.callService).toHaveBeenCalledWith("fan", "set_percentage", { entity_id: FAN, percentage: 100 });
  });

  it("follows a drag and sends the speed once, on release", async () => {
    const hass = sixSpeed();
    const el = await mountCard({ fan_entity: FAN }, hass);
    pointer(el, "pointerdown", ...LEFT_END);
    pointer(el, "pointermove", ...RIGHT_END);
    await (el as unknown as { updateComplete: Promise<boolean> }).updateComplete;
    expect($(el, ".speed-seg.active")?.textContent?.trim()).toBe("6");
    expect(hass.callService).not.toHaveBeenCalled();
    pointer(el, "pointerup", ...RIGHT_END);
    expect(hass.callService).toHaveBeenCalledTimes(1);
    expect(hass.callService).toHaveBeenCalledWith("fan", "set_percentage", { entity_id: FAN, percentage: 100 });
  });

  it("drops a cancelled drag", async () => {
    const hass = sixSpeed();
    const el = await mountCard({ fan_entity: FAN }, hass);
    pointer(el, "pointerdown", ...RIGHT_END);
    pointer(el, "pointercancel", ...RIGHT_END);
    pointer(el, "pointerup", ...RIGHT_END);
    expect(hass.callService).not.toHaveBeenCalled();
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
