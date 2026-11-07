import { describe, expect, it } from "vitest";
import {
  fanBaseName,
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

describe("fanBaseName", () => {
  it("strips the domain", () => {
    expect(fanBaseName("fan.ceiling_fan_with_light")).toBe("ceiling_fan_with_light");
  });
  it("returns null without an entity", () => {
    expect(fanBaseName(undefined)).toBeNull();
  });
});

describe("resolveEntities", () => {
  it("discovers the CREATE Windcalm entities", () => {
    const hass = makeHass([
      entity("fan.ceiling_fan_with_light", "on"),
      entity("light.ceiling_fan_with_light", "on"),
      entity("number.ceiling_fan_with_light_minuteur", "0"),
      entity("switch.ceiling_fan_with_light_son", "off"),
    ]);
    expect(resolveEntities(hass, { fan_entity: "fan.ceiling_fan_with_light" })).toMatchObject({
      fan: "fan.ceiling_fan_with_light",
      light: "light.ceiling_fan_with_light",
      timer: "number.ceiling_fan_with_light_minuteur",
      sound: "switch.ceiling_fan_with_light_son",
    });
  });

  it("falls back to a select timer (Klassfan)", () => {
    const hass = makeHass([
      entity("fan.klassfan_ceiling_fan", "on"),
      entity("select.klassfan_ceiling_fan_minuteur", "off"),
    ]);
    expect(resolveEntities(hass, { fan_entity: "fan.klassfan_ceiling_fan" }).timer).toBe(
      "select.klassfan_ceiling_fan_minuteur",
    );
  });

  it("lets explicit overrides win", () => {
    const hass = makeHass([
      entity("fan.f", "on"),
      entity("light.f", "on"),
      entity("light.other", "on"),
    ]);
    expect(resolveEntities(hass, { fan_entity: "fan.f", light_entity: "light.other" }).light).toBe(
      "light.other",
    );
  });
});

import { parseSpeedPercentages, percentageToTableSpeed } from "../src/types";

describe("custom speed percentages", () => {
  const table = [1, 21, 41, 60, 80, 100];

  it("accepts lists and comma-separated text", () => {
    expect(parseSpeedPercentages(table)).toEqual(table);
    expect(parseSpeedPercentages("1, 21 41;60,80 ,100")).toEqual(table);
  });

  it("rejects invalid lists", () => {
    for (const bad of ["", "1, x", [3, 2], [0, 5], [10, 200], [], undefined, "1,1"]) {
      expect(parseSpeedPercentages(bad)).toBeUndefined();
    }
  });

  it("maps a percentage to the highest speed not above it", () => {
    expect([0, 1, 20, 21, 59, 60, 79, 80, 100].map((p) => percentageToTableSpeed(p, table))).toEqual(
      [0, 1, 1, 2, 3, 4, 4, 5, 6],
    );
  });
});
