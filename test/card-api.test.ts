import { afterEach, describe, expect, it } from "vitest";
import { $, entity, makeHass, mountCard } from "./helpers";

type CardClass = {
  getStubConfig(hass?: unknown, entities?: string[]): { fan_entity: string };
};
const Card = customElements.get("fan-bridge-card") as unknown as CardClass;

const FAN = "fan.f";
const fan = (features = 1 | 16 | 32) =>
  entity(FAN, "on", { supported_features: features, percentage: 50 });

afterEach(() => {
  document.body.innerHTML = "";
});

describe("getStubConfig (audit A1)", () => {
  it("previews the first fan of the instance", () => {
    expect(Card.getStubConfig(undefined, ["light.a", "fan.living_room", "fan.bedroom"]).fan_entity).toBe(
      "fan.living_room",
    );
  });

  it("falls back to hass.states", () => {
    const hass = makeHass([entity("light.a", "on"), entity("fan.attic", "off")]);
    expect(Card.getStubConfig(hass, []).fan_entity).toBe("fan.attic");
  });

  it("keeps a placeholder when there is no fan", () => {
    expect(Card.getStubConfig(undefined, []).fan_entity).toBe("fan.ceiling_fan_with_light");
  });
});

describe("missing entity (audit D2)", () => {
  it("names the missing entity in English", async () => {
    const el = await mountCard({ fan_entity: "fan.gone" }, makeHass([]));
    expect($(el, ".error")?.textContent?.trim()).toBe("Entity fan.gone not found");
  });

  it("names the missing entity in French", async () => {
    const el = await mountCard({ fan_entity: "fan.gone" }, makeHass([], "fr"));
    expect($(el, ".error")?.textContent?.trim()).toBe("Entité fan.gone introuvable");
  });
});

describe("FanBridge fan only", () => {
  it("shows an unavailable FanBridge fan as unavailable, not as a foreign fan", async () => {
    // Home Assistant drops using_backup (an extra attribute) while unavailable.
    const el = await mountCard({ fan_entity: FAN }, makeHass([entity(FAN, "unavailable", { using_backup: undefined })]));
    expect($(el, ".error")).toBeNull();
    expect($(el, ".unavailable-msg")?.textContent?.trim()).toBe("Unavailable");
  });

  it("refuses a fan of another integration", async () => {
    const hass = makeHass([fan()]);
    hass.entities![FAN].platform = "tuya";
    const el = await mountCard({ fan_entity: FAN }, hass);
    expect($(el, ".error")?.textContent).toContain("is not a FanBridge fan");
  });
});

describe("sizing (audit A6)", () => {
  it("grows with the rendered rows", async () => {
    const plain = await mountCard({ fan_entity: FAN, show_name: false }, makeHass([fan(16 | 32)]));
    expect(plain.getCardSize()).toBe(3);
    const full = await mountCard(
      { fan_entity: FAN },
      makeHass([
        fan(),
        entity("light.f", "on", { supported_color_modes: ["color_temp"] }),
      ]),
    );
    expect(full.getCardSize()).toBe(6);
  });

  it("exposes sections-view grid options", async () => {
    const el = await mountCard({ fan_entity: FAN }, makeHass([fan()]));
    expect((el as unknown as { getGridOptions(): unknown }).getGridOptions()).toEqual({
      columns: 12,
      rows: "auto",
      min_columns: 6,
    });
  });
});
