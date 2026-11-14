import { LitElement, html, css, nothing, svg, PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { live } from "lit/directives/live.js";
import "./fan-bridge-card-editor";
import type { HassEntity, HomeAssistant } from "./ha-types";
import { localize } from "./localize/localize";
import {
  FanBridgeCardConfig,
  ResolvedEntities,
  TIMER_OPTIONS_MIN,
  DEFAULT_SPEED_COUNT,
  percentageToSpeed,
  speedCount,
  speedToCommandPercentage,
  speedToPercentage,
  resolveEntities,
  isBridgeFan,
  fanSupports,
  fanSupportsDirection,
  FanFeature,
  isFanOn,
  isFanUnavailable,
} from "./types";

class FanBridgeCard extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @state() private _config!: FanBridgeCardConfig;
  // The colour-temperature slider is tucked behind the light chip.
  @state() private _tempOpen = false;

  // ── Static HA card registration ─────────────────────────────────────────────

  // Called by the card picker with the instance's entities: preview the first
  // real fan rather than a hard-coded id that only exists in the devcontainer.
  public static getStubConfig(
    hass?: HomeAssistant,
    entities: string[] = [],
  ): FanBridgeCardConfig {
    const fan =
      entities.find((id) => id.startsWith("fan.")) ??
      Object.keys(hass?.states ?? {}).find((id) => id.startsWith("fan.")) ??
      "fan.ceiling_fan_with_light";
    return { fan_entity: fan, show_name: true };
  }

  public static getConfigElement() {
    return document.createElement("fan-bridge-card-editor");
  }

  // Masonry height in ~50 px units: status row (2) + control bar (1), plus the
  // title, the speed bar and the colour-temperature row when shown.
  public getCardSize(): number {
    let size = 3;
    if (this._config?.show_name !== false) size += 1;
    if (!this._fanState || this._fanSupportsSpeed) size += 1;
    if (this._showColorTemp) size += 1;
    return size;
  }

  // Sections view: full width by default, never narrower than half, height
  // follows the content (the temperature row comes and goes).
  public getGridOptions(): {
    columns: number;
    rows: "auto";
    min_columns: number;
  } {
    return { columns: 12, rows: "auto", min_columns: 6 };
  }

  // ── Config ──────────────────────────────────────────────────────────────────

  public setConfig(config: FanBridgeCardConfig): void {
    if (!config?.fan_entity) throw new Error("fan_entity is required.");
    this._config = {
      show_name: true,
      summer_direction: "forward",
      ...config,
    };
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  private _t(
    key: Parameters<typeof localize>[1],
    params?: Parameters<typeof localize>[2],
  ): string {
    return localize(this.hass, key, params);
  }

  // ── Entity resolution (memoized) ────────────────────────────────────────────
  //
  // The light, timer and beep are found in the entity registry, so this only
  // runs when the config or the registry changes, not on each state update.

  private _resolved?: ResolvedEntities;
  private _resolvedFor?: HomeAssistant["entities"];

  private get _entities(): ResolvedEntities {
    return this._resolved ?? resolveEntities(this.hass, this._config);
  }

  private _trackedIds(resolved: ResolvedEntities): string[] {
    return [resolved.fan, resolved.light, resolved.timer, resolved.sound].filter(
      (id): id is string => !!id,
    );
  }

  // Only re-render when something the card displays changed: the config, the
  // language, the registry, or the state of one of the tracked entities.
  protected shouldUpdate(changed: PropertyValues): boolean {
    if (!this._config) return false;
    if ([...changed.keys()].some((k) => k !== "hass")) return true;
    const old = changed.get("hass") as HomeAssistant | undefined;
    if (!old || !this.hass || !this._resolved) return true;
    if (
      old.language !== this.hass.language ||
      old.locale?.language !== this.hass.locale?.language
    ) {
      return true;
    }
    if (this.hass.entities !== this._resolvedFor) return true;
    return this._trackedIds(this._resolved).some(
      (id) => old.states?.[id] !== this.hass.states?.[id],
    );
  }

  protected willUpdate(changed: PropertyValues): void {
    if (changed.has("_config") || !this._resolved || this.hass?.entities !== this._resolvedFor) {
      this._resolved = resolveEntities(this.hass, this._config);
      this._resolvedFor = this.hass?.entities;
    }
  }

  private get _fanState(): HassEntity | undefined {
    return this.hass?.states?.[this._entities.fan];
  }
  private get _lightState(): HassEntity | undefined {
    const id = this._entities.light;
    return id ? this.hass?.states?.[id] : undefined;
  }
  private get _timerState(): HassEntity | undefined {
    const id = this._entities.timer;
    return id ? this.hass?.states?.[id] : undefined;
  }
  private get _soundState(): HassEntity | undefined {
    const id = this._entities.sound;
    return id ? this.hass?.states?.[id] : undefined;
  }

  private get _currentSpeed(): number {
    const fan = this._fanState;
    if (!isFanOn(fan)) return 0;
    const pct = Number(fan.attributes?.percentage ?? 0);
    return percentageToSpeed(pct, this._speedCount);
  }

  // Number of segments of the speed bar, derived from percentage_step.
  private get _speedCount(): number {
    return speedCount(this._fanState);
  }

  private get _fanSupportsDirection(): boolean {
    return fanSupportsDirection(this._fanState);
  }

  private get _fanSupportsSpeed(): boolean {
    return fanSupports(this._fanState, FanFeature.SET_SPEED);
  }

  private get _fanSupportsOscillate(): boolean {
    return fanSupports(this._fanState, FanFeature.OSCILLATE);
  }

  private get _isOscillating(): boolean {
    return this._fanState?.attributes?.oscillating === true;
  }

  private get _canTurnOn(): boolean {
    return fanSupports(this._fanState, FanFeature.TURN_ON);
  }

  private get _canTurnOff(): boolean {
    return fanSupports(this._fanState, FanFeature.TURN_OFF);
  }

  private get _fanDirection(): "forward" | "reverse" {
    return this._fanState?.attributes?.direction === "reverse"
      ? "reverse"
      : "forward";
  }

  // Which raw direction ("forward"/"reverse") corresponds to summer mode —
  // configurable since not every fan spins the same way for summer.
  private get _summerDirection(): "forward" | "reverse" {
    return this._config.summer_direction === "reverse" ? "reverse" : "forward";
  }

  private get _winterDirection(): "forward" | "reverse" {
    return this._summerDirection === "forward" ? "reverse" : "forward";
  }

  private get _isSummerMode(): boolean {
    return this._fanDirection === this._summerDirection;
  }

  private get _isLightOn(): boolean {
    return this._lightState?.state === "on";
  }

  private get _lightSupportsColorTemp(): boolean {
    const modes: string[] = this._lightState?.attributes?.supported_color_modes ?? [];
    return modes.includes("color_temp");
  }

  private get _minKelvin(): number {
    return Number(this._lightState?.attributes?.min_color_temp_kelvin ?? 2700);
  }
  private get _maxKelvin(): number {
    return Number(this._lightState?.attributes?.max_color_temp_kelvin ?? 6500);
  }
  private get _currentKelvin(): number {
    return Number(
      this._lightState?.attributes?.color_temp_kelvin ?? this._minKelvin
    );
  }

  private get _showColorTemp(): boolean {
    return !!this._lightState && this._isLightOn && this._lightSupportsColorTemp;
  }

  private get _isSoundOn(): boolean {
    return this._soundState?.state === "on";
  }

  // The fan is "on" whenever HA reports it on — this includes preset modes that
  // may report percentage 0. Controls that the hardware ignores while powered
  // off (light, timer, sound, direction, preset) key off this.
  private get _isOn(): boolean {
    return isFanOn(this._fanState);
  }

  private get _fanSupportsPreset(): boolean {
    return fanSupports(this._fanState, FanFeature.PRESET_MODE) && this._presetModes.length > 0;
  }
  private get _presetModes(): string[] {
    return this._fanState?.attributes?.preset_modes ?? [];
  }
  private get _presetMode(): string {
    return this._fanState?.attributes?.preset_mode ?? "";
  }
  // "normal" is the neutral/manual preset — the fan simply follows its speed,
  // so it is not treated as an active special mode for the header display.
  private get _activePreset(): string {
    const p = this._presetMode;
    return !p || p.toLowerCase() === "normal" ? "" : p;
  }
  private _formatPreset(p: string): string {
    return p ? p.charAt(0).toUpperCase() + p.slice(1) : p;
  }

  // "select" domain covers fans (e.g. Klassfan) whose timer is a predefined
  // list of options rather than a free-form "number" entity.
  private get _timerDomain(): "number" | "select" {
    return this._entities.timer?.startsWith("select.") ? "select" : "number";
  }

  // Normalize so the value matches an option string exactly. A "number" entity
  // may report "30.0" while the options are "30" — compare numerically there;
  // a "select" entity's state is already one of its literal option strings.
  private get _timerValue(): string {
    const raw = this._timerState?.state;
    if (raw === undefined || raw === null || raw === "") return "";
    if (this._timerDomain === "select") return String(raw);
    const n = Number(raw);
    return Number.isNaN(n) ? String(raw) : String(n);
  }

  private get _timerOptions(): string[] {
    if (this._timerDomain === "select") {
      return this._timerState?.attributes?.options ?? [];
    }
    return TIMER_OPTIONS_MIN.map(String);
  }

  // Options rendered in the timer select: the entity's current value is added
  // when it is not one of the presets (e.g. a number timer set to 45 min
  // elsewhere), so the select never falls back to showing "None".
  private get _timerChoices(): string[] {
    const options = this._timerOptions;
    const value = this._timerValue;
    if (value === "" || options.includes(value)) return options;
    if (this._timerDomain === "select") return [...options, value];
    return [...options, value].sort((a, b) => Number(a) - Number(b));
  }

  private _formatTimerOption(raw: string): string {
    const n = Number(raw);
    if (raw.trim() === "" || Number.isNaN(n)) return raw;
    if (n === 0) return this._t("controls.timer_none");
    return n < 60 ? `${n} min` : `${n / 60} h`;
  }

  // The first option is the "no timer" sentinel (0 minutes, or a fan's own
  // "off" select option) — anything else counts as an active countdown.
  private get _isTimerActive(): boolean {
    const [none] = this._timerOptions;
    return this._timerValue !== "" && this._timerValue !== none;
  }

  // The named labels (Gentle … Turbo) were written for 6-speed fans; any other
  // speed count gets a plain numbered label.
  private _speedStateLabel(speed: number): string {
    // A fan without SET_SPEED has no speed to name: plain on / off.
    if (!this._fanSupportsSpeed) {
      return this._t(this._isOn ? "speed.state_on" : "speed.state_off");
    }
    if (speed === 0) return this._t("speed.state_off");
    if (this._speedCount !== DEFAULT_SPEED_COUNT) {
      return this._t("speed.state_generic", { speed });
    }
    return this._t(`speed.state_s${speed}` as Parameters<typeof localize>[1]);
  }

  private _speedLabel(speed: number): string {
    if (this._speedCount !== DEFAULT_SPEED_COUNT) {
      return this._t("speed.generic", { speed });
    }
    return this._t(`speed.s${speed}` as Parameters<typeof localize>[1]);
  }

  // ── Actions ─────────────────────────────────────────────────────────────────

  // Every service call goes through here: a rejected call (unsupported
  // service, device offline, validation error) is logged once instead of
  // surfacing as an "Uncaught (in promise)", and the card re-renders so
  // controls bound with live() snap back to the entity's real state.
  private _call(domain: string, service: string, data: Record<string, unknown>): void {
    const fail = (err: unknown) => {
      console.error(`fan-bridge-card: ${domain}.${service} failed`, err);
      this.requestUpdate();
    };
    try {
      Promise.resolve(this.hass.callService(domain, service, data)).catch(fail);
    } catch (err) {
      fail(err);
    }
  }

  private _setSpeed(speed: number): void {
    if (speed === 0) {
      this._call("fan", "turn_off", { entity_id: this._entities.fan });
    } else {
      this._call("fan", "set_percentage", {
        entity_id: this._entities.fan,
        percentage: speedToCommandPercentage(speed, this._speedCount),
      });
    }
  }

  private _togglePower(): void {
    this._call("fan", this._isOn ? "turn_off" : "turn_on", {
      entity_id: this._entities.fan,
    });
  }

  private _toggleOscillate(): void {
    this._call("fan", "oscillate", {
      entity_id: this._entities.fan,
      oscillating: !this._isOscillating,
    });
  }

  private _setPreset(ev: Event): void {
    this._call("fan", "set_preset_mode", {
      entity_id: this._entities.fan,
      preset_mode: (ev.target as HTMLSelectElement).value,
    });
  }

  private _setDirection(direction: "forward" | "reverse"): void {
    this._call("fan", "set_direction", {
      entity_id: this._entities.fan,
      direction,
    });
  }

  private _setSeason(season: "summer" | "winter"): void {
    this._setDirection(season === "summer" ? this._summerDirection : this._winterDirection);
  }

  private _toggleLight(): void {
    if (!this._entities.light) return;
    this._call("light", "toggle", { entity_id: this._entities.light });
  }

  private _setColorTemp(ev: Event): void {
    if (!this._entities.light) return;
    const kelvin = Number((ev.target as HTMLInputElement).value);
    this._call("light", "turn_on", {
      entity_id: this._entities.light,
      color_temp_kelvin: kelvin,
    });
  }

  private _setTimer(ev: Event): void {
    if (!this._entities.timer) return;
    const value = (ev.target as HTMLSelectElement).value;
    if (this._timerDomain === "select") {
      this._call("select", "select_option", {
        entity_id: this._entities.timer,
        option: value,
      });
    } else {
      this._call("number", "set_value", {
        entity_id: this._entities.timer,
        value: Number(value),
      });
    }
  }

  private _toggleSound(): void {
    if (!this._entities.sound) return;
    this._call("switch", "toggle", { entity_id: this._entities.sound });
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  // The speed dial is a 270° arc opening at the bottom, drawn in a 300×276
  // viewBox; the numbered speed buttons and the power button are positioned in
  // the same coordinates (as percentages of the dial box).
  private static readonly _DIAL = { cx: 150, cy: 150, r: 118, start: 135, sweep: 270, w: 300, h: 276 };

  private _dialPoint(deg: number, radius: number): [number, number] {
    const { cx, cy } = FanBridgeCard._DIAL;
    const rad = (deg * Math.PI) / 180;
    return [cx + radius * Math.cos(rad), cy + radius * Math.sin(rad)];
  }

  private get _dialPath(): string {
    const { r, start, sweep } = FanBridgeCard._DIAL;
    const [x1, y1] = this._dialPoint(start, r);
    const [x2, y2] = this._dialPoint(start + sweep, r);
    return `M ${x1} ${y1} A ${r} ${r} 0 1 1 ${x2} ${y2}`;
  }

  // Tapping the arc picks the speed nearest to the tapped angle.
  private _onDialClick(ev: MouseEvent): void {
    const svg = (ev.currentTarget as SVGGraphicsElement).ownerSVGElement;
    if (!svg || isFanUnavailable(this._fanState)) return;
    const { cx, cy, start, sweep, w, h } = FanBridgeCard._DIAL;
    const box = svg.getBoundingClientRect();
    if (!box.width || !box.height) return;
    const x = ((ev.clientX - box.left) / box.width) * w - cx;
    const y = ((ev.clientY - box.top) / box.height) * h - cy;
    let angle = ((Math.atan2(y, x) * 180) / Math.PI - start + 360) % 360;
    // The bottom gap belongs to the nearest end of the arc.
    if (angle > sweep) angle = angle > sweep + (360 - sweep) / 2 ? 0 : sweep;
    const count = this._speedCount;
    this._setSpeed(Math.min(count, Math.max(1, Math.round((angle / sweep) * count))));
  }

  private _renderSpeedIcon(speed: number) {
    const animDurations = ["none", "2.5s", "1.5s", "0.9s", "0.6s", "0.35s", "0.15s"];
    // A fan without SET_SPEED has no percentage: spin at a medium pace when on.
    const onOffOnly = !this._fanSupportsSpeed && this._isOn;
    const isOff = speed === 0 && !onOffOnly;
    // Scale the speed onto the 6-step animation table so any speed count spins
    // from slow to fast (identity mapping on 6-speed fans).
    const step = onOffOnly
      ? 3
      : Math.max(1, Math.round((speed * DEFAULT_SPEED_COUNT) / this._speedCount));
    const iconStyle = isOff
      ? ""
      : `animation: spin ${animDurations[step]} linear infinite;`;
    return html`
      <div class="fan-icon-wrap ${isOff ? "off" : ""}">
        <svg
          viewBox="0 0 24 24"
          width="28"
          height="28"
          fill="currentColor"
          class="fan-svg ${isOff ? "off" : ""}"
          style="${iconStyle}"
          aria-hidden="true"
        >
          <path d="M12,11A1,1 0 0,0 11,12A1,1 0 0,0 12,13A1,1 0 0,0 13,12A1,1 0 0,0 12,11M12.5,2C17,2 17.11,5.57 14.75,6.75C13.76,7.24 13.32,8.29 13.13,9.22C13.61,9.42 14.03,9.73 14.35,10.13C18.05,8.13 22.03,8.92 22.03,12.5C22.03,17 18.46,17.1 17.28,14.73C16.78,13.74 15.72,13.3 14.79,13.11C14.59,13.59 14.28,14 13.88,14.34C15.87,18.03 15.08,22 11.5,22C7,22 6.91,18.42 9.27,17.24C10.25,16.75 10.69,15.71 10.89,14.79C10.4,14.59 9.97,14.27 9.65,13.87C5.96,15.85 2,15.07 2,11.5C2,7 5.56,6.89 6.74,9.26C7.24,10.25 8.29,10.69 9.22,10.88C9.41,10.4 9.73,9.97 10.13,9.65C8.14,5.96 8.92,2 12.5,2Z" />
        </svg>
      </div>
    `;
  }

  // Summer: streaks of air sweeping across the card. Winter: particles slowly
  // rising, like air pushed up along the walls. Purely decorative.
  private _renderFx() {
    if (!this._fanSupportsDirection) return nothing;
    if (this._isSummerMode) {
      return html`<div class="fx summer" aria-hidden="true">
        ${[18, 30, 44, 58, 70, 82].map(
          (y, i) =>
            html`<i style="--y:${y}%;--d:${2.6 + (i % 3) * 0.7}s;--delay:${-i * 0.9}s"></i>`,
        )}
      </div>`;
    }
    return html`<div class="fx winter" aria-hidden="true">
      ${Array.from(
        { length: 14 },
        (_, i) =>
          html`<i
            style="--x:${6 + i * 6.7}%;--s:${3 + (i % 3)}px;--d:${5 + (i % 4)}s;--delay:${-i * 0.8}s;--dx:${(i % 2 ? 1 : -1) * (10 + (i % 5) * 6)}px"
          ></i>`,
      )}
    </div>`;
  }

  private _renderPower(isUnavailable: boolean) {
    if (!this._canTurnOn && !this._canTurnOff) return nothing;
    return html`
      <button
        class="ctrl-btn power ${this._isOn ? "on" : ""}"
        @click=${this._togglePower}
        ?disabled=${isUnavailable || (this._isOn ? !this._canTurnOff : !this._canTurnOn)}
        aria-label="${this._t("controls.power")}"
        title="${this._t("controls.power")}"
      >
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
          <path d="M12 4v8"/>
          <path d="M7.8 6.8a6 6 0 1 0 8.4 0"/>
        </svg>
      </button>
    `;
  }

  private _renderDial(speed: number, isUnavailable: boolean) {
    const { w, h, r, start, sweep } = FanBridgeCard._DIAL;
    const count = this._speedCount;
    const fraction = speed / count;
    const [tx, ty] = this._dialPoint(start + sweep * fraction, r);
    const pos = (deg: number, radius: number) => {
      const [x, y] = this._dialPoint(deg, radius);
      return `left:${(x / w) * 100}%;top:${(y / h) * 100}%`;
    };
    const ticks = Array.from({ length: count + 1 }, (_, i) => {
      const angle = start + (sweep * i) / count;
      const [x1, y1] = this._dialPoint(angle, r - 22);
      const [x2, y2] = this._dialPoint(angle, r - 13);
      return svg`<line class="tick ${i <= speed && speed > 0 ? "lit" : ""}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" />`;
    });
    return html`
      <div class="dial speed-bar">
        <svg class="ring" viewBox="0 0 ${w} ${h}" aria-hidden="true">
          <path class="track" d="${this._dialPath}" />
          ${speed > 0
            ? svg`<path class="value" d="${this._dialPath}" pathLength="100" stroke-dasharray="100" stroke-dashoffset="${100 - fraction * 100}" />`
            : nothing}
          ${ticks}
          <circle class="thumb ${speed === 0 ? "idle" : ""}" cx="${tx}" cy="${ty}" r="13" />
          <path class="hit" d="${this._dialPath}" @click=${this._onDialClick} />
        </svg>
        <div class="center">
          <div class="cap">${this._t("speed.label")}</div>
          <div class="big">${speed}<small>/${count}</small></div>
          <div class="fan-pct">
            ${!this._isOn
              ? "—"
              : this._activePreset
              ? this._t("controls.preset")
              : `${speedToPercentage(speed, count)}%`}
          </div>
        </div>
        ${Array.from({ length: count }, (_, i) => i + 1).map(
          (s) => html`
            <button
              class="speed-seg ${speed >= s && speed > 0 ? "filled" : ""} ${speed === s ? "active" : ""}"
              style="${pos(start + (sweep * s) / count, r - 36)}"
              @click=${() => this._setSpeed(s)}
              ?disabled=${isUnavailable}
              aria-label="${this._speedLabel(s)}"
              aria-pressed=${speed === s}
            >${s}</button>
          `,
        )}
        <div class="dial-power">${this._renderPower(isUnavailable)}</div>
      </div>
    `;
  }

  private _renderSeason() {
    const summer = this._isSummerMode;
    return html`
      <div class="season">
        <div class="season-cap">
          <span>${this._t("controls.dir_caption")}</span>
          <em>${this._t(summer ? "controls.dir_summer_hint" : "controls.dir_winter_hint")}</em>
        </div>
        <div class="season-toggle">
          <button
            class="season-btn summer ${summer ? "active" : ""}"
            @click=${() => this._setSeason("summer")}
            ?disabled=${!this._isOn}
            aria-label="${this._t("controls.dir_summer")}"
            aria-pressed=${summer}
            title="${this._t("controls.dir_summer")}"
          >
            <ha-icon icon="mdi:weather-sunny"></ha-icon>
            <span>${this._t("controls.dir_summer")}</span>
          </button>
          <button
            class="season-btn winter ${!summer ? "active" : ""}"
            @click=${() => this._setSeason("winter")}
            ?disabled=${!this._isOn}
            aria-label="${this._t("controls.dir_winter")}"
            aria-pressed=${!summer}
            title="${this._t("controls.dir_winter")}"
          >
            <ha-icon icon="mdi:snowflake"></ha-icon>
            <span>${this._t("controls.dir_winter")}</span>
          </button>
        </div>
      </div>
    `;
  }

  private _renderChips(isUnavailable: boolean, lightDisabled: boolean) {
    const off = isUnavailable || !this._isOn;
    return html`
      <div class="chips">
        ${this._fanSupportsPreset
          ? html`
            <div class="chip ${this._activePreset ? "on" : ""} ${off ? "disabled" : ""}">
              <ha-icon icon="mdi:tune-variant"></ha-icon>
              <span class="chip-label">${this._presetMode ? this._formatPreset(this._presetMode) : this._t("controls.preset")}</span>
              <select
                class="preset-select ${this._activePreset ? "active" : ""}"
                .value=${live(this._presetMode)}
                @change=${this._setPreset}
                ?disabled=${off}
                aria-label="${this._t("controls.preset")}"
                title="${this._t("controls.preset")}"
              >
                ${this._presetModes.includes(this._presetMode)
                  ? nothing
                  : html`<option value="" disabled selected>—</option>`}
                ${this._presetModes.map(
                  (p) => html`<option value="${p}" ?selected=${p === this._presetMode}>${this._formatPreset(p)}</option>`,
                )}
              </select>
            </div>
          `
          : nothing}

        ${this._fanSupportsOscillate
          ? html`
            <button
              class="ctrl-btn chip oscillate ${this._isOscillating ? "on" : ""}"
              @click=${this._toggleOscillate}
              ?disabled=${off}
              aria-label="${this._t("controls.oscillate")}"
              aria-pressed=${this._isOscillating}
              title="${this._t("controls.oscillate")}"
            >
              <ha-icon icon="${this._isOscillating ? "mdi:arrow-oscillating" : "mdi:arrow-oscillating-off"}"></ha-icon>
              <span class="chip-label">${this._t("controls.oscillate")}</span>
            </button>
          `
          : nothing}

        ${this._lightState
          ? html`
            <div class="chip split ${this._isLightOn ? "on" : ""} ${lightDisabled ? "disabled" : ""}">
              <button
                class="ctrl-btn light main ${this._isLightOn ? "on" : ""}"
                @click=${this._toggleLight}
                ?disabled=${lightDisabled}
                aria-label="${this._t("controls.light")}"
                aria-pressed=${this._isLightOn}
                title="${this._t("controls.light")}"
              >
                <ha-icon icon="${this._isLightOn ? "mdi:lightbulb-outline" : "mdi:lightbulb-off-outline"}"></ha-icon>
                <span class="chip-label">${this._t("controls.light")}</span>
              </button>
              ${this._showColorTemp
                ? html`
                  <button
                    class="temp-toggle ${this._tempOpen ? "open" : ""}"
                    @click=${() => (this._tempOpen = !this._tempOpen)}
                    aria-label="${this._t("controls.color_temp")}"
                    aria-expanded=${this._tempOpen}
                    title="${this._t("controls.color_temp")}"
                  >
                    <ha-icon icon="mdi:white-balance-sunny"></ha-icon>
                    <span>K</span>
                  </button>
                `
                : nothing}
            </div>
          `
          : nothing}

        ${this._timerState
          ? html`
            <div class="chip ${this._isTimerActive ? "on" : ""} ${off ? "disabled" : ""}">
              <ha-icon icon="mdi:timer-outline"></ha-icon>
              <span class="chip-label">${this._isTimerActive ? this._formatTimerOption(this._timerValue) : this._t("controls.timer")}</span>
              <select
                class="ctrl-select ${this._isTimerActive ? "active" : ""}"
                .value=${live(String(this._timerValue))}
                @change=${this._setTimer}
                ?disabled=${off}
                aria-label="${this._t("controls.timer")}"
                title="${this._t("controls.timer")}"
              >
                ${this._timerChoices.map(
                  (opt) => html`
                    <option value="${opt}" ?selected=${opt === this._timerValue}>${this._formatTimerOption(opt)}</option>
                  `,
                )}
              </select>
            </div>
          `
          : nothing}

        ${this._soundState
          ? html`
            <button
              class="ctrl-btn chip sound ${this._isSoundOn ? "on" : ""}"
              @click=${this._toggleSound}
              ?disabled=${off}
              aria-label="${this._t("controls.sound")}"
              aria-pressed=${this._isSoundOn}
              title="${this._t("controls.sound")}"
            >
              <ha-icon icon="${this._isSoundOn ? "mdi:volume-high" : "mdi:volume-off"}"></ha-icon>
              <span class="chip-label">${this._t("controls.sound")}</span>
            </button>
          `
          : nothing}
      </div>
    `;
  }

  protected render() {
    if (!this._config) return nothing;
    if (!this.hass) return nothing;

    const fan = this._fanState;
    if (!fan) {
      // The config is valid; the entity just does not exist (renamed, removed,
      // integration not loaded yet): say which one instead of "configure me".
      return html`<ha-card>
        <div class="error" role="alert">
          ${this._t("card.entity_not_found", { entity: this._config.fan_entity })}
        </div>
      </ha-card>`;
    }

    if (!isBridgeFan(fan)) {
      return html`<ha-card>
        <div class="error" role="alert">
          ${this._t("card.not_bridge", { entity: this._config.fan_entity })}
        </div>
      </ha-card>`;
    }

    const speed = this._currentSpeed;
    const isUnavailable = isFanUnavailable(fan);
    // The light follows the fan unless configured as independent, in which
    // case only the light's own availability matters.
    const lightDisabled = this._config.light_independent
      ? isFanUnavailable(this._lightState)
      : isUnavailable || !this._isOn;
    const cardName =
      this._config.name ||
      fan.attributes?.friendly_name ||
      this._t("card.name_default");
    // The integration reports when the fan is running on its backup.
    const onFallback = fan.attributes?.using_backup === true;
    const active = this._isOn && !isUnavailable;

    return html`
      <ha-card>
        <div class="card-content ${isUnavailable ? "unavailable" : ""} ${this._isOn ? "" : "idle"}">
          ${active ? this._renderFx() : nothing}

          <div class="card-header">
            ${this._renderSpeedIcon(speed)}
            <div class="head-text">
              ${this._config.show_name !== false
                ? html`<div class="card-title">${cardName}</div>`
                : nothing}
              <div class="status">
                <span class="dot"></span>
                <span class="fan-state">${this._activePreset
                  ? this._formatPreset(this._activePreset)
                  : this._speedStateLabel(speed)}</span>
                ${this._fanSupportsDirection && this._isOn
                  ? html`<span class="fan-season">· ${this._t(this._isSummerMode ? "controls.dir_summer" : "controls.dir_winter")}</span>`
                  : nothing}
              </div>
            </div>
            ${onFallback
              ? html`<span class="badge" title="${this._entities.fan}">${this._t("card.fallback_badge")}</span>`
              : nothing}
          </div>

          ${isUnavailable
            ? html`<div class="unavailable-msg">${this._t("card.unavailable")}</div>`
            : nothing}

          ${this._fanSupportsSpeed
            ? this._renderDial(speed, isUnavailable)
            : html`<div class="onoff">${this._renderPower(isUnavailable)}</div>`}

          ${this._fanSupportsDirection ? this._renderSeason() : nothing}

          ${this._renderChips(isUnavailable, lightDisabled)}

          ${this._showColorTemp && this._tempOpen
            ? html`
              <div class="temp-row">
                <span class="temp-label warm">${this._t("controls.temp_warm")}</span>
                <input
                  class="temp-slider"
                  type="range"
                  min="${this._minKelvin}"
                  max="${this._maxKelvin}"
                  step="100"
                  .value=${live(String(this._currentKelvin))}
                  @change=${this._setColorTemp}
                  ?disabled=${this._config.light_independent ? lightDisabled : isUnavailable}
                  aria-label="${this._t("controls.color_temp")}"
                />
                <span class="temp-label cool">${this._t("controls.temp_cool")}</span>
                <span class="temp-value">${this._currentKelvin}K</span>
              </div>
            `
            : nothing}
        </div>
      </ha-card>
    `;
  }

  static styles = css`
    /* Colours derive from the HA theme (text, card background, dividers) so
       light and dark themes both work; only the accent is a fixed green,
       overridable with --fan-bridge-card-accent. The hex value is a fallback. */
    :host {
      --wc-accent: var(--fan-bridge-card-accent, #2fd1a0);
      --wc-text: var(--primary-text-color);
      --wc-dim: var(--secondary-text-color);
      --wc-surface: color-mix(in srgb, var(--primary-text-color) 7%, transparent);
      --wc-line: color-mix(in srgb, var(--primary-text-color) 15%, transparent);
      --wc-focus-ring: 2px solid var(--wc-accent);
    }

    button:focus-visible,
    .temp-slider:focus-visible {
      outline: var(--wc-focus-ring);
      outline-offset: 2px;
    }

    ha-card {
      position: relative;
      overflow: hidden;
      border-radius: 26px;
      background: linear-gradient(
        160deg,
        color-mix(in srgb, var(--card-background-color, transparent) 92%, var(--primary-text-color) 8%),
        var(--card-background-color, transparent)
      );
    }

    /* --wc-a is the colour in use: the accent while running, grey while idle. */
    .card-content {
      --wc-a: var(--wc-accent);
      --wc-a-soft: color-mix(in srgb, var(--wc-a) 55%, white);
      /* Accent for text: pulled towards the theme's text colour rather than
         white, so it stays readable on a light card as on a dark one. */
      --wc-a-text: color-mix(in srgb, var(--wc-a) 70%, var(--primary-text-color));
      --wc-on-a: color-mix(in srgb, var(--wc-a) 18%, black);
      --wc-glow: color-mix(in srgb, var(--wc-a) 30%, transparent);
      position: relative;
      padding: 18px 18px 16px;
      box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--wc-a) 28%, var(--wc-line));
      border-radius: inherit;
      transition: box-shadow 0.4s;
    }
    .card-content.idle {
      --wc-a: var(--wc-dim);
      --wc-glow: transparent;
      box-shadow: inset 0 0 0 1px var(--wc-line);
    }
    .card-content.unavailable {
      opacity: 0.6;
    }
    .card-content::before {
      content: "";
      position: absolute;
      inset: -30% -20% auto -20%;
      height: 70%;
      background: radial-gradient(closest-side, var(--wc-glow), transparent 70%);
      pointer-events: none;
    }
    .card-content > *:not(.fx) {
      position: relative;
      z-index: 1;
    }

    /* Season effects */
    .fx {
      position: absolute;
      inset: 0;
      z-index: 0;
      overflow: hidden;
      pointer-events: none;
    }
    .fx i {
      position: absolute;
      opacity: 0;
    }
    .fx.summer i {
      left: -40%;
      top: var(--y);
      width: 40%;
      height: 2px;
      border-radius: 2px;
      background: linear-gradient(90deg, transparent, var(--wc-a-soft), transparent);
      animation: streak var(--d) linear infinite;
      animation-delay: var(--delay);
    }
    .fx.winter i {
      bottom: -10px;
      left: var(--x);
      width: var(--s);
      height: var(--s);
      border-radius: 50%;
      background: var(--wc-a-soft);
      box-shadow: 0 0 8px var(--wc-a);
      animation: rise var(--d) ease-in infinite;
      animation-delay: var(--delay);
    }
    @keyframes streak {
      0% { transform: translateX(0); opacity: 0; }
      15% { opacity: 0.55; }
      85% { opacity: 0.45; }
      100% { transform: translateX(380%); opacity: 0; }
    }
    @keyframes rise {
      0% { transform: translate(0, 0); opacity: 0; }
      15% { opacity: 0.8; }
      100% { transform: translate(var(--dx), -460px); opacity: 0; }
    }

    /* Header */
    .card-header {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .head-text {
      min-width: 0;
      flex: 1;
    }
    .card-title {
      font-size: 20px;
      font-weight: 700;
      line-height: 1.15;
      color: var(--wc-text);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .status {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 3px;
      font-size: 14px;
      color: var(--wc-dim);
      min-width: 0;
    }
    .status .fan-state {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .status .fan-season {
      white-space: nowrap;
    }
    .dot {
      width: 9px;
      height: 9px;
      border-radius: 50%;
      flex: none;
      background: var(--wc-a);
      box-shadow: 0 0 8px var(--wc-a);
    }
    .badge {
      flex: none;
      font-size: 11px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      padding: 4px 9px;
      border-radius: 999px;
      color: var(--wc-a-text);
      border: 1px solid color-mix(in srgb, var(--wc-a) 50%, transparent);
      background: color-mix(in srgb, var(--wc-a) 12%, transparent);
    }

    .unavailable-msg {
      font-size: 13px;
      color: var(--wc-dim);
      text-align: center;
      padding: 8px 0 0;
    }

    .fan-icon-wrap {
      width: 48px;
      height: 48px;
      border-radius: 15px;
      display: grid;
      place-items: center;
      flex: none;
      color: var(--wc-a);
      background: color-mix(in srgb, var(--wc-a) 16%, var(--wc-surface));
      border: 1px solid color-mix(in srgb, var(--wc-a) 45%, transparent);
      transition: color 0.3s, background 0.3s, border-color 0.3s;
    }
    .fan-icon-wrap.off {
      background: var(--wc-surface);
      border-color: var(--wc-line);
    }
    .fan-svg {
      transform-origin: center;
    }
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    /* The spin is set inline per speed; !important lets the user's
       reduced-motion preference win over it. */
    @media (prefers-reduced-motion: reduce) {
      .fan-svg {
        animation: none !important;
      }
      .fx {
        display: none;
      }
    }

    /* Dial */
    .dial {
      position: relative;
      width: 100%;
      max-width: 320px;
      margin: 4px auto 22px;
      aspect-ratio: 300 / 276;
    }
    .ring {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      overflow: visible;
    }
    .track,
    .value,
    .hit {
      fill: none;
      stroke-width: 16;
      stroke-linecap: round;
    }
    .track {
      stroke: var(--wc-line);
    }
    .value {
      stroke: var(--wc-a);
      filter: drop-shadow(0 0 8px var(--wc-glow));
      transition: stroke-dashoffset 0.35s ease;
    }
    .hit {
      stroke: transparent;
      stroke-width: 44;
      cursor: pointer;
      pointer-events: stroke;
    }
    .tick {
      stroke: var(--wc-line);
      stroke-width: 2;
      stroke-linecap: round;
    }
    .tick.lit {
      stroke: var(--wc-a);
    }
    .thumb {
      fill: var(--wc-text);
      stroke: var(--wc-a);
      stroke-width: 5;
      filter: drop-shadow(0 0 8px var(--wc-a));
      pointer-events: none;
      transition: cx 0.35s, cy 0.35s;
    }
    .thumb.idle {
      filter: none;
    }
    .center {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding-top: 5%;
      pointer-events: none;
    }
    .center .cap {
      font-size: 12px;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: var(--wc-dim);
    }
    .center .big {
      font-size: 64px;
      font-weight: 800;
      line-height: 1;
      color: var(--wc-text);
    }
    .center .big small {
      font-size: 24px;
      font-weight: 700;
      margin-left: 2px;
      color: var(--wc-a-text);
    }
    .idle .center .big {
      color: var(--wc-dim);
    }
    .fan-pct {
      margin-top: 4px;
      font-size: 15px;
      color: var(--wc-dim);
    }

    .speed-seg {
      position: absolute;
      transform: translate(-50%, -50%);
      width: 28px;
      height: 28px;
      padding: 0;
      border: 0;
      border-radius: 50%;
      background: transparent;
      color: var(--wc-dim);
      font: 600 12px inherit;
      cursor: pointer;
      transition: color 0.15s, background 0.15s;
    }
    .speed-seg.filled {
      color: var(--wc-a-text);
    }
    .speed-seg.active {
      color: var(--wc-on-a);
      background: var(--wc-a);
      font-weight: 800;
    }
    .speed-seg:hover:not(:disabled):not(.active) {
      background: var(--wc-surface);
    }
    .speed-seg:disabled {
      cursor: default;
      opacity: 0.5;
    }

    .dial-power {
      position: absolute;
      left: 50%;
      top: 88%;
      transform: translate(-50%, -50%);
    }
    .onoff {
      display: flex;
      justify-content: center;
      padding: 18px 0 8px;
    }

    .ctrl-btn.power {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      border: 1px solid var(--wc-line);
      background: var(--wc-surface);
      color: var(--wc-dim);
      display: grid;
      place-items: center;
      padding: 0;
      cursor: pointer;
      transition: 0.2s;
    }
    .ctrl-btn.power:hover:not(:disabled) {
      border-color: var(--wc-a);
      box-shadow: 0 0 12px -2px var(--wc-a);
    }
    .ctrl-btn.power.on {
      color: var(--wc-on-a);
      background: linear-gradient(180deg, var(--wc-a-soft), var(--wc-a));
      border-color: transparent;
      box-shadow: 0 6px 16px -4px var(--wc-glow);
    }
    .ctrl-btn:disabled {
      cursor: default;
      opacity: 0.4;
    }

    /* Season */
    .season-cap {
      display: flex;
      justify-content: space-between;
      gap: 8px;
      margin: 0 4px 6px;
      font-size: 11px;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: var(--wc-dim);
    }
    .season-cap em {
      font-style: normal;
      letter-spacing: 0;
      text-transform: none;
    }
    .season-toggle {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4px;
      padding: 5px;
      border-radius: 18px;
      background: var(--wc-surface);
      border: 1px solid var(--wc-line);
    }
    .season-btn {
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      border: 0;
      border-radius: 14px;
      background: transparent;
      color: var(--wc-dim);
      font: 700 14px inherit;
      cursor: pointer;
      padding: 0;
      transition: background 0.2s, color 0.2s;
    }
    .season-btn ha-icon {
      --mdc-icon-size: 22px;
      display: flex;
    }
    .season-btn.active {
      color: var(--wc-on-a);
      background: linear-gradient(180deg, var(--wc-a-soft), var(--wc-a));
      box-shadow: 0 6px 16px -4px var(--wc-glow);
    }
    .season-btn:disabled {
      cursor: default;
      opacity: 0.4;
    }

    /* Chips */
    .chips {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-top: 10px;
    }
    .chips > :last-child:nth-child(odd) {
      grid-column: 1 / -1;
    }
    .chip {
      position: relative;
      height: 46px;
      padding: 0 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      border-radius: 14px;
      border: 1px solid var(--wc-line);
      background: var(--wc-surface);
      color: var(--wc-text);
      font: 700 14px inherit;
      cursor: pointer;
      transition: border-color 0.2s, background 0.2s;
      min-width: 0;
    }
    .chip ha-icon {
      --mdc-icon-size: 20px;
      display: flex;
      flex: none;
      color: var(--wc-dim);
    }
    .chip-label {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .chip.on {
      border-color: color-mix(in srgb, var(--wc-a) 55%, transparent);
      background: color-mix(in srgb, var(--wc-a) 12%, var(--wc-surface));
    }
    .chip.on ha-icon,
    .chip.on .ctrl-btn ha-icon {
      color: var(--wc-a);
    }
    .chip.disabled,
    .chip:disabled {
      opacity: 0.4;
      cursor: default;
    }
    .ctrl-btn.chip {
      width: auto;
    }
    .ctrl-btn.chip:hover:not(:disabled),
    .chip:hover:not(.disabled) {
      border-color: var(--wc-a);
    }
    .chip select {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      opacity: 0;
      cursor: pointer;
    }
    .chip select:disabled {
      cursor: default;
    }
    .chip.split {
      padding: 0;
      gap: 0;
      overflow: hidden;
      cursor: default;
    }
    .chip.split .main {
      flex: 1;
      min-width: 0;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      border: 0;
      background: transparent;
      color: inherit;
      font: inherit;
      cursor: pointer;
      padding: 0 12px;
    }
    .chip.split .main ha-icon {
      --mdc-icon-size: 20px;
      display: flex;
      color: var(--wc-dim);
    }
    .chip.split.on .main ha-icon {
      color: var(--wc-a);
    }
    .temp-toggle {
      flex: none;
      width: 56px;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 2px;
      border: 0;
      border-left: 1px solid var(--wc-line);
      background: transparent;
      color: var(--wc-dim);
      font: 700 11px inherit;
      cursor: pointer;
      padding: 0;
    }
    .temp-toggle ha-icon {
      --mdc-icon-size: 18px;
      display: flex;
    }
    .temp-toggle:hover,
    .temp-toggle.open {
      color: var(--wc-a);
      background: color-mix(in srgb, var(--wc-a) 10%, transparent);
    }

    /* Colour temperature (collapsed behind the light chip) */
    .temp-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 10px;
      padding: 12px 14px;
      border-radius: 16px;
      background: var(--wc-surface);
      border: 1px solid var(--wc-line);
    }
    .temp-label {
      font-size: 11px;
      flex-shrink: 0;
      color: var(--wc-dim);
    }
    .temp-value {
      font-size: 12px;
      font-weight: 700;
      color: var(--wc-text);
      min-width: 46px;
      text-align: right;
      flex-shrink: 0;
    }
    .temp-slider {
      flex: 1;
      -webkit-appearance: none;
      appearance: none;
      height: 8px;
      border-radius: 4px;
      /* Depicts the light's colour temperature itself (warm to cool white),
         so it is intentionally theme-independent. */
      background: linear-gradient(to right, #ffb46e, #fff6e8 50%, #cfe4ff);
      outline: none;
      cursor: pointer;
    }
    .temp-slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: var(--wc-text);
      border: 4px solid var(--wc-accent);
      cursor: pointer;
    }
    .temp-slider::-moz-range-thumb {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: var(--wc-text);
      border: 4px solid var(--wc-accent);
      cursor: pointer;
    }
    .temp-slider:disabled {
      opacity: 0.5;
      cursor: default;
    }

    .error {
      padding: 16px;
      font-size: 13px;
      color: var(--error-color, #db4437);
    }
  `;
}

// Guarded: the bundle may be loaded twice (the integration loads it, and a
// dashboard resource may too).
if (!customElements.get("fan-bridge-card")) {
  customElements.define("fan-bridge-card", FanBridgeCard);
}

declare global {
  interface Window {
    customCards?: { type: string; name: string; description: string; preview?: boolean }[];
  }
}

window.customCards = window.customCards || [];
if (!window.customCards.some((card) => card.type === "fan-bridge-card"))
  window.customCards.push({
  type: "fan-bridge-card",
  name: "FanBridge Card",
  description: "Custom card for smart ceiling fans (CREATE Windcalm, Klassfan, …)",
  preview: true,
});
