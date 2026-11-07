import { vi } from "vitest";
import type { HassEntity, HomeAssistant } from "../src/ha-types";
import "../src/fan-bridge-card";
import type { FanBridgeCardConfig } from "../src/types";

export function entity(
  entity_id: string,
  state: string,
  attributes: Record<string, unknown> = {},
): HassEntity {
  return { entity_id, state, attributes };
}

export function makeHass(
  entities: HassEntity[],
  language = "en",
): HomeAssistant & { callService: ReturnType<typeof vi.fn> } {
  const states: Record<string, HassEntity> = {};
  for (const e of entities) states[e.entity_id] = e;
  return {
    states,
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
