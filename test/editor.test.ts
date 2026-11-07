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
  it("only offers the fan and a few display options", async () => {
    const { form } = await mountEditor({ fan_entity: "fan.f" }, IDS);
    expect(form.schema.map((s) => s.name)).toEqual([
      "fan_entity",
      "name",
      "show_name",
      "light_independent",
      "summer_direction",
    ]);
  });

  it("leaves out the direction when the fan has none", async () => {
    const el = document.createElement("fan-bridge-card-editor") as EditorElement;
    el.hass = makeHass([entity("fan.f", "on", { supported_features: 0 })]);
    el.setConfig({ fan_entity: "fan.f" });
    document.body.appendChild(el);
    await el.updateComplete;
    const form = el.shadowRoot!.querySelector("ha-form") as FormElement;
    expect(form.schema.map((s) => s.name)).not.toContain("summer_direction");
  });

  it("keeps the options the form does not show", async () => {
    const config = { fan_entity: "fan.f", light_entity: "light.other", speed_percentages: [20, 40, 60] };
    const { el, form } = await mountEditor(config, IDS);
    const listener = vi.fn();
    el.addEventListener("config-changed", listener);
    emit(form, { ...form.data, name: "Salon" });
    expect(listener.mock.calls[0][0].detail.config).toEqual({ ...config, name: "Salon" });
  });

  it("explains where the rest is set", async () => {
    const { el } = await mountEditor({ fan_entity: "fan.f" }, IDS);
    expect(el.shadowRoot!.querySelector(".note")?.textContent).toContain("FanBridge");
  });

  it("shows the managed note for a fan merged by the integration", async () => {
    const el = document.createElement("fan-bridge-card-editor") as EditorElement;
    el.hass = makeHass([entity("fan.f", "on", { supported_features: 4, using_backup: false, source_entity: "fan.local" })]);
    el.setConfig({ fan_entity: "fan.f" });
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector(".note")?.textContent).toContain("Configure");
  });
});
