import { vi } from "vitest";
import type { HassEntity, HomeAssistant } from "../src/ha-types";
import "../src/fan-bridge-card";
import type { FanBridgeCardConfig } from "../src/types";

export function entity(
  entity_id: string,
  state: string,
  attributes: Record<string, unknown> = {},
): HassEntity {
  // A fan of the test is a FanBridge fan, unless it says otherwise.
  const bridge = entity_id.startsWith("fan.") && !("using_backup" in attributes);
  return { entity_id, state, attributes: bridge ? { using_backup: false, ...attributes } : attributes };
}

// What the FanBridge integration registers for a fan, by domain.
const ROLE_OF_DOMAIN: Record<string, string | undefined> = {
  light: "light",
  select: "timer",
  number: "timer",
  switch: "sound",
};

export function makeHass(
  entities: HassEntity[],
  language = "en",
): HomeAssistant & { callService: ReturnType<typeof vi.fn> } {
  const states: Record<string, HassEntity> = {};
  for (const e of entities) states[e.entity_id] = e;
  // Every entity of the test belongs to one FanBridge device.
  const registry: NonNullable<HomeAssistant["entities"]> = {};
  for (const e of entities) {
    registry[e.entity_id] = {
      entity_id: e.entity_id,
      device_id: "device",
      platform: "fan_bridge",
      translation_key: ROLE_OF_DOMAIN[e.entity_id.split(".")[0]],
    };
  }
  return {
    states,
    entities: registry,
    language,
    locale: { language },
    callService: vi.fn().mockResolvedValue(undefined),
  };
}

export type CardElement = HTMLElement & {
  hass: HomeAssistant;
  setConfig(config: FanBridgeCardConfig): void;
  updateComplete: Promise<boolean>;
  getCardSize(): number;
};

export async function mountCard(
  config: FanBridgeCardConfig,
  hass: HomeAssistant,
): Promise<CardElement> {
  const el = document.createElement("fan-bridge-card") as CardElement;
  el.setConfig(config);
  el.hass = hass;
  document.body.appendChild(el);
  await el.updateComplete;
  return el;
}

// The colour-temperature slider is tucked behind a toggle next to the light chip.
export async function openTempPanel(el: CardElement): Promise<void> {
  ($(el, ".temp-toggle") as HTMLButtonElement).click();
  await el.updateComplete;
}

export function $(el: HTMLElement, selector: string): HTMLElement | null {
  return el.shadowRoot!.querySelector(selector);
}

export function $$(el: HTMLElement, selector: string): HTMLElement[] {
  return Array.from(el.shadowRoot!.querySelectorAll(selector));
}
