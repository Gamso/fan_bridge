// Minimal typings for the parts of the Home Assistant frontend objects this
// card touches. Kept local on purpose: custom-card-helpers is unmaintained and
// its HomeAssistant type lags the frontend, so it was dropped (see CHANGELOG).

export interface HassEntity {
  entity_id: string;
  state: string;
  attributes: Record<string, any>;
  last_changed?: string;
  last_updated?: string;
}

export type HassEntities = Record<string, HassEntity>;

export interface HomeAssistant {
  states: HassEntities;
  language?: string;
  locale?: { language?: string };
  callService(
    domain: string,
    service: string,
    serviceData?: Record<string, unknown>,
  ): Promise<unknown>;
}

/** Dispatch a bubbling, composed event the way the HA frontend expects. */
export function fireEvent<T>(node: EventTarget, type: string, detail: T): void {
  node.dispatchEvent(
    new CustomEvent(type, { bubbles: true, composed: true, detail }),
  );
}
