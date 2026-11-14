import { LitElement, html, css } from "lit";
import { property, state } from "lit/decorators.js";
import { localize, TranslationKey } from "./localize/localize";
import { FanBridgeCardConfig, fanSupportsDirection, isBridgeFan } from "./types";
import { fireEvent, HomeAssistant } from "./ha-types";

// Ensure the HA form components are registered (they ship with the frontend
// but are only loaded on demand via other cards' config elements).
const loadHaComponents = () => {
  if (!customElements.get("ha-form")) {
    (customElements.get("hui-button-card") as any)?.getConfigElement?.();
  }
  if (!customElements.get("ha-entity-picker")) {
    (customElements.get("hui-entities-card") as any)?.getConfigElement?.();
  }
};

class FanBridgeCardEditor extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @state() private _config!: FanBridgeCardConfig;

  public connectedCallback(): void {
    super.connectedCallback();
    if (this.hass) loadHaComponents();
  }

  public setConfig(config: FanBridgeCardConfig): void {
    this._config = { ...config };
  }

  private get _managed(): boolean {
    return isBridgeFan(this.hass, this._config?.fan_entity);
  }

  // The visual editor only picks the fan and a few display options: the backup,
  // light, timer, beep and speeds belong to the integration.
  private get _schema() {
    const schema: Record<string, unknown>[] = [
      { name: "fan_entity", required: true, selector: { entity: { domain: "fan" } } },
      { name: "name", selector: { text: {} } },
      { name: "show_name", selector: { boolean: {} } },
      { name: "light_independent", selector: { boolean: {} } },
    ];
    if (fanSupportsDirection(this.hass?.states?.[this._config?.fan_entity])) {
      schema.push(this._directionField());
    }
    return schema;
  }

  private _directionField(): Record<string, unknown> {
    return {
      name: "summer_direction",
      selector: {
        select: {
          mode: "list",
          options: [
            { value: "forward", label: this._t("editor.dir_forward") },
            { value: "reverse", label: this._t("editor.dir_reverse") },
          ],
        },
      },
    };
  }

  private _t(key: TranslationKey): string {
    return localize(this.hass, key);
  }

  private _computeLabel = (schema: { name: string }): string => {
    const map: Record<string, TranslationKey> = {
      fan_entity: "editor.fan_entity",
      name: "editor.name",
      show_name: "editor.show_name",
      summer_direction: "editor.summer_direction",
      light_independent: "editor.light_independent",
    };
    return map[schema.name] ? this._t(map[schema.name]) : schema.name;
  };

  private _valueChanged(ev: CustomEvent): void {
    fireEvent(this, "config-changed", { config: { ...ev.detail.value } });
  }

  protected render() {
    if (!this.hass || !this._config) return html``;
    return html`
      <div class="note">${this._t(this._managed ? "editor.managed" : "editor.standalone")}</div>
      <ha-form
        .hass=${this.hass}
        .data=${this._config}
        .schema=${this._schema}
        .computeLabel=${this._computeLabel}
        @value-changed=${this._valueChanged}
      ></ha-form>
    `;
  }

  static styles = css`
    ha-form {
      width: 100%;
    }
    .note {
      margin-bottom: 12px;
      padding: 12px;
      border-radius: 8px;
      background: var(--secondary-background-color);
      color: var(--secondary-text-color);
      font-size: 13px;
    }
  `;
}

if (!customElements.get("fan-bridge-card-editor")) {
  customElements.define("fan-bridge-card-editor", FanBridgeCardEditor);
}
