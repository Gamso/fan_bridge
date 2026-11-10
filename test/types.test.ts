import { describe, expect, it } from "vitest";
import {
  isBridgeFan,
  percentageToSpeed,
  resolveEntities,
  speedCount,
  speedToCommandPercentage,
  speedToPercentage,
} from "../src/types";
import { entity, makeHass } from "./helpers";

describe("6-speed percentage mapping", () => {
  it.each([
    [0, 0],
    [17, 1],
    [33, 2],
    [50, 3],
    [67, 4],
    [83, 5],
    [100, 6],
  ])("%i %% is speed %i", (pct, speed) => {
    expect(percentageToSpeed(pct)).toBe(speed);
  });

  it.each([
    [1, 17],
    [2, 33],
    [3, 50],
    [4, 67],
    [5, 83],
    [6, 100],
  ])("speed %i is %i %%", (speed, pct) => {
    expect(speedToPercentage(speed)).toBe(pct);
  });
});

describe("speedCount", () => {
  const fan = (attributes: Record<string, unknown>) => entity("fan.f", "on", attributes);

  it.each([
    [100 / 6, 6],
    [16.666666666666668, 6],
    [100 / 3, 3],
    [25, 4],
    [20, 5],
  ])("percentage_step %f gives %i speeds", (step, count) => {
    expect(speedCount(fan({ percentage_step: step }))).toBe(count);
  });

  it("falls back to 6 without percentage_step", () => {
    expect(speedCount(fan({}))).toBe(6);
    expect(speedCount(undefined)).toBe(6);
    expect(speedCount(fan({ percentage_step: 0 }))).toBe(6);
    expect(speedCount(fan({ percentage_step: "abc" }))).toBe(6);
  });

  it("falls back to 6 for continuous fans (speed_count 100)", () => {
    expect(speedCount(fan({ percentage_step: 1 }))).toBe(6);
  });
});

// How integrations turn a percentage back into a speed: HA's
// percentage_to_ordered_list_item, ceil(percentage_to_ranged_value) and a
// plain round. A command percentage must land on the requested speed for all.
const orderedList = (pct: number, count: number) => {
  for (let i = 1; i <= count; i++) if (pct <= Math.floor((i * 100) / count)) return i;
  return count;
};
const ceilRanged = (pct: number, count: number) => Math.ceil((pct * count) / 100);
const rounded = (pct: number, count: number) => Math.round((pct * count) / 100);

describe.each([3, 4, 6])("%i-speed fan", (count) => {
  const speeds = Array.from({ length: count }, (_, i) => i + 1);

  it.each(speeds)("speed %i round-trips through the displayed percentage", (speed) => {
    expect(percentageToSpeed(speedToPercentage(speed, count), count)).toBe(speed);
  });

  it.each(speeds)("speed %i command lands on the same speed for every integration style", (speed) => {
    const pct = speedToCommandPercentage(speed, count);
    expect(orderedList(pct, count)).toBe(speed);
    expect(ceilRanged(pct, count)).toBe(speed);
    expect(rounded(pct, count)).toBe(speed);
    expect(percentageToSpeed(pct, count)).toBe(speed);
  });

  it.each(speeds)("HA-reported percentage for speed %i reads back as that speed", (speed) => {
    // ordered_list_item_to_percentage: (position * 100) // count
    expect(percentageToSpeed(Math.floor((speed * 100) / count), count)).toBe(speed);
  });
});

describe("speed mapping per count", () => {
  it("3 speeds: 33 / 67 / 100 displayed, 33 / 66 / 100 sent", () => {
    expect([1, 2, 3].map((s) => speedToPercentage(s, 3))).toEqual([33, 67, 100]);
    expect([1, 2, 3].map((s) => speedToCommandPercentage(s, 3))).toEqual([33, 66, 100]);
  });
  it("4 speeds: 25 / 50 / 75 / 100", () => {
    expect([1, 2, 3, 4].map((s) => speedToPercentage(s, 4))).toEqual([25, 50, 75, 100]);
    expect([1, 2, 3, 4].map((s) => speedToCommandPercentage(s, 4))).toEqual([25, 50, 75, 100]);
  });
  it("6 speeds: sent percentages are HA's own speed boundaries", () => {
    expect([1, 2, 3, 4, 5, 6].map((s) => speedToCommandPercentage(s))).toEqual([
      16, 33, 50, 66, 83, 100,
    ]);
  });
  it("audit scenario: 66 % on a 3-speed fan is speed 2, not 4", () => {
    expect(percentageToSpeed(66, 3)).toBe(2);
  });
});

describe("isBridgeFan", () => {
  it("is true for a fan that reports using_backup", () => {
    expect(isBridgeFan(entity("fan.f", "on", { using_backup: false }))).toBe(true);
    expect(isBridgeFan(entity("fan.f", "on", { using_backup: true }))).toBe(true);
  });
  it("is false for any other fan, or a missing one", () => {
    expect(isBridgeFan(entity("fan.f", "on", { using_backup: undefined }))).toBe(false);
    expect(isBridgeFan(undefined)).toBe(false);
  });
});

describe("resolveEntities", () => {
  it("finds the light, timer and beep of the fan's device by translation key", () => {
    const hass = makeHass([
      entity("fan.f", "on"),
      entity("light.f_light", "on"),
      entity("select.f_timer", "off"),
      entity("switch.f_sound", "off"),
    ]);
    expect(resolveEntities(hass, { fan_entity: "fan.f" })).toEqual({
      fan: "fan.f",
      light: "light.f_light",
      timer: "select.f_timer",
      sound: "switch.f_sound",
    });
  });

  it("follows entity ids the user renamed", () => {
    const hass = makeHass([entity("fan.f", "on"), entity("light.salon_lamp", "on")]);
    expect(resolveEntities(hass, { fan_entity: "fan.f" }).light).toBe("light.salon_lamp");
  });

  it("ignores the entities of another device or integration", () => {
    const hass = makeHass([entity("fan.f", "on"), entity("light.f_light", "on"), entity("light.other", "on")]);
    hass.entities!["light.other"].device_id = "elsewhere";
    hass.entities!["light.f_light"].platform = "tuya";
    expect(resolveEntities(hass, { fan_entity: "fan.f" }).light).toBeUndefined();
  });

  it("finds nothing without a registry", () => {
    const hass = makeHass([entity("fan.f", "on"), entity("light.f_light", "on")]);
    delete hass.entities;
    expect(resolveEntities(hass, { fan_entity: "fan.f" })).toEqual({ fan: "fan.f" });
  });
});
