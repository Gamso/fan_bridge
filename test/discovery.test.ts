import { describe, expect, it } from "vitest";
import { resolveEntities } from "../src/types";
import { entity, makeHass } from "./helpers";

const resolve = (fan: string, ids: string[]) =>
  resolveEntities(makeHass(ids.map((id) => entity(id, "on"))), { fan_entity: fan });

describe("resolveEntities — two fans sharing a prefix (audit B4)", () => {
  const ids = [
    "fan.ceiling_fan",
    "fan.ceiling_fan_2",
    "light.ceiling_fan_2_light",
    "number.ceiling_fan_2_timer",
    "switch.ceiling_fan_2_sound",
    "switch.ceiling_fan_oscillation",
  ];

  it("does not hand the second fan's entities to the first", () => {
    const r = resolve("fan.ceiling_fan", ids);
    expect(r.light).toBeUndefined();
    expect(r.timer).toBeUndefined();
    expect(r.sound).toBeUndefined();
  });

  it("never picks an oscillation switch as the beep", () => {
    expect(resolve("fan.ceiling_fan", ids).sound).toBeUndefined();
  });

  it("still resolves the second fan's own entities", () => {
    expect(resolve("fan.ceiling_fan_2", ids)).toMatchObject({
      light: "light.ceiling_fan_2_light",
      timer: "number.ceiling_fan_2_timer",
      sound: "switch.ceiling_fan_2_sound",
    });
  });
});

describe("resolveEntities — matching order", () => {
  it("requires the '_' separator", () => {
    expect(resolve("fan.desk", ["fan.desk", "light.desktop_lamp"]).light).toBeUndefined();
  });

  it("prefers the exact name", () => {
    expect(resolve("fan.f", ["fan.f", "light.f", "light.f_light"]).light).toBe("light.f");
  });

  it("prefers a known suffix over an unknown one", () => {
    expect(resolve("fan.f", ["fan.f", "switch.f_son", "switch.f_eco"]).sound).toBe("switch.f_son");
  });

  it("accepts a single unknown suffix (other languages)", () => {
    expect(resolve("fan.f", ["fan.f", "switch.f_ton"]).sound).toBe("switch.f_ton");
  });

  it("does not take a switch named like the fan as the beep", () => {
    expect(resolve("fan.f", ["fan.f", "switch.f"]).sound).toBeUndefined();
  });

  it("does not take another role's entity by elimination", () => {
    expect(resolve("fan.f", ["fan.f", "switch.f_light"]).sound).toBeUndefined();
  });

  it("reports ambiguity instead of choosing", () => {
    const r = resolve("fan.f", ["fan.f", "switch.f_sound", "switch.f_beep"]);
    expect(r.sound).toBeUndefined();
    expect(r.ambiguous.sound).toEqual(["switch.f_sound", "switch.f_beep"]);
  });

  it("reports ambiguity between unknown suffixes", () => {
    const r = resolve("fan.f", ["fan.f", "switch.f_a", "switch.f_b"]);
    expect(r.sound).toBeUndefined();
    expect(r.ambiguous.sound).toEqual(["switch.f_a", "switch.f_b"]);
  });

  it("falls back from number to select for the timer", () => {
    expect(resolve("fan.f", ["fan.f", "select.f_minuteur", "select.f_mode"]).timer).toBe(
      "select.f_minuteur",
    );
  });

  it("does not report ambiguity for overridden roles", () => {
    const hass = makeHass(["fan.f", "switch.f_a", "switch.f_b"].map((id) => entity(id, "on")));
    const r = resolveEntities(hass, { fan_entity: "fan.f", sound_entity: "switch.f_a" });
    expect(r.sound).toBe("switch.f_a");
    expect(r.ambiguous).toEqual({});
  });
});

describe("resolveEntities — fallback fan", () => {
  const config = {
    fan_entity: "fan.k_offline",
    fallback_fan_entity: "fan.k_online",
    light_entity: "light.k_offline",
  };
  const hass = (offline: string, online = "on") =>
    makeHass([
      entity("fan.k_offline", offline),
      entity("fan.k_online", online),
      entity("light.k_offline", "off"),
      entity("light.k_online", "off"),
    ]);

  it("prefers the primary fan while it is available", () => {
    const r = resolveEntities(hass("on"), config);
    expect(r.fan).toBe("fan.k_offline");
    expect(r.light).toBe("light.k_offline");
  });

  it("switches to the fallback, and its own light, when the primary is unavailable", () => {
    for (const state of ["unavailable", "unknown"]) {
      const r = resolveEntities(hass(state), config);
      expect(r.fan).toBe("fan.k_online");
      expect(r.light).toBe("light.k_online");
    }
  });

  it("stays on the primary when the fallback is unavailable too", () => {
    expect(resolveEntities(hass("unavailable", "unavailable"), config).fan).toBe("fan.k_offline");
  });

  it("ignores a fallback equal to the primary", () => {
    const r = resolveEntities(hass("unavailable"), { ...config, fallback_fan_entity: "fan.k_offline" });
    expect(r.fan).toBe("fan.k_offline");
  });
});

describe("resolveEntities — fallback overrides", () => {
  const hass = makeHass([
    entity("fan.k_offline", "unavailable"),
    entity("fan.k_online", "on"),
    entity("light.k_offline", "off"),
    entity("light.k_online", "off"),
    entity("light.custom_cloud", "off"),
    entity("switch.k_son_online", "off"),
  ]);
  const config = {
    fan_entity: "fan.k_offline",
    fallback_fan_entity: "fan.k_online",
    light_entity: "light.k_offline",
    sound_entity: "switch.k_son_online",
  };

  it("uses the fallback_* overrides while the backup fan is in charge", () => {
    const r = resolveEntities(hass, {
      ...config,
      fallback_light_entity: "light.custom_cloud",
      fallback_sound_entity: "switch.k_son_online",
    });
    expect(r.fan).toBe("fan.k_online");
    expect(r.light).toBe("light.custom_cloud");
    expect(r.sound).toBe("switch.k_son_online");
  });

  it("does not reuse the main fan's overrides on the backup fan", () => {
    const r = resolveEntities(hass, config);
    expect(r.light).toBe("light.k_online");
    expect(r.sound).toBeUndefined();
  });
});
