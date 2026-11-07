import { afterEach, describe, expect, it, vi } from "vitest";
import type { FanBridgeCardConfig } from "../src/types";
import { entity, makeHass } from "./helpers";
import "../src/fan-bridge-card-editor";

type EditorElement = HTMLElement & {
  hass: ReturnType<typeof makeHass>;
  setConfig(config: FanBridgeCardConfig): void;
  updateComplete: Promise<boolean>;
};

type FormElement = HTMLElement & {
  data: FanBridgeCardConfig;
  schema: { name: string }[];
};

async function mountEditor(config: FanBridgeCardConfig, ids: string[]) {
  const el = document.createElement("fan-bridge-card-editor") as EditorElement;
  el.hass = makeHass(ids.map((id) => entity(id, "on", id.startsWith("fan.") ? { supported_features: 4 } : {})));
  el.setConfig(config);
  document.body.appendChild(el);
  await el.updateComplete;
  const form = el.shadowRoot!.querySelector("ha-form") as FormElement;
  return { el, form };
}

function emit(form: HTMLElement, value: FanBridgeCardConfig) {
  form.dispatchEvent(new CustomEvent("value-changed", { detail: { value } }));
}

afterEach(() => {
  document.body.innerHTML = "";
});

const IDS = ["fan.f", "light.f", "number.f_minuteur", "switch.f_son"];

describe("editor", () => {
  it("offers light, timer and sound pickers", async () => {
    const { form } = await mountEditor({ fan_entity: "fan.f" }, IDS);
    expect(form.schema.map((s) => s.name)).toEqual([
      "fan_entity",
      "fallback_fan_entity",
      "speed_percentages",
      "name",
      "show_name",
      "light_entity",
      "light_independent",
      "timer_entity",
      "sound_entity",
      "summer_direction",
    ]);
  });

  it("pre-fills the pickers with the discovered entities", async () => {
    const { form } = await mountEditor({ fan_entity: "fan.f" }, IDS);
    expect(form.data).toMatchObject({
      light_entity: "light.f",
      timer_entity: "number.f_minuteur",
      sound_entity: "switch.f_son",
    });
  });

  it("does not freeze discovered entities into the config", async () => {
    const { el, form } = await mountEditor({ fan_entity: "fan.f" }, IDS);
    const listener = vi.fn();
    el.addEventListener("config-changed", listener);
    emit(form, { ...form.data, name: "Salon" });
    expect(listener.mock.calls[0][0].detail.config).toEqual({ fan_entity: "fan.f", name: "Salon" });
  });

  it("writes an explicitly chosen entity", async () => {
    const { el, form } = await mountEditor({ fan_entity: "fan.f" }, [...IDS, "light.other"]);
    const listener = vi.fn();
    el.addEventListener("config-changed", listener);
    emit(form, { ...form.data, light_entity: "light.other" });
    expect(listener.mock.calls[0][0].detail.config).toEqual({
      fan_entity: "fan.f",
      light_entity: "light.other",
    });
  });

  it("keeps an existing override even if it equals the discovered entity", async () => {
    const { el, form } = await mountEditor({ fan_entity: "fan.f", light_entity: "light.f" }, IDS);
    const listener = vi.fn();
    el.addEventListener("config-changed", listener);
    emit(form, form.data);
    expect(listener.mock.calls[0][0].detail.config.light_entity).toBe("light.f");
  });

  it("flags ambiguous discovery with its candidates", async () => {
    const { el } = await mountEditor({ fan_entity: "fan.f" }, ["fan.f", "switch.f_sound", "switch.f_beep"]);
    const root = el.shadowRoot!;
    expect(root.querySelector(".dr-id.ambiguous")?.textContent).toContain("several matches");
    expect(root.querySelector(".dr-candidates")?.textContent).toBe("switch.f_sound, switch.f_beep");
  });
  it("leaves the backup, entities and speeds to the integration for a merged fan", async () => {
    const el = document.createElement("fan-bridge-card-editor") as EditorElement;
    el.hass = makeHass([
      entity("fan.f", "on", { supported_features: 4, using_backup: false, source_entity: "fan.local" }),
      entity("light.f_light", "on", {}),
    ]);
    el.setConfig({ fan_entity: "fan.f" });
    document.body.appendChild(el);
    await el.updateComplete;
    const form = el.shadowRoot!.querySelector("ha-form") as FormElement;
    expect(form.schema.map((s) => s.name)).toEqual([
      "fan_entity",
      "name",
      "show_name",
      "light_independent",
      "summer_direction",
    ]);
    expect(el.shadowRoot!.querySelector(".managed")).not.toBeNull();
    expect(el.shadowRoot!.querySelector(".discovered")).toBeNull();
  });
});
