import type { HassEntity, HomeAssistant } from "./ha-types";

// The card only works with a fan created by the FanBridge integration: the
// backup fan, the speed percentages, the light, the timer and the beep are all
// set in the integration, and the card follows what its entities report.
export interface FanBridgeCardConfig {
  name?: string;
  show_name?: boolean;
  fan_entity: string;
  // Which physical rotation direction ("forward"/"reverse", as reported by the
  // fan entity) corresponds to summer mode. Not every fan spins counter-clockwise
  // for summer, so this lets the user match the card's Été/Hiver buttons to the
  // fan's actual rotation. Defaults to "forward".
  summer_direction?: "forward" | "reverse";
  // Most ceiling-fan kits cut the light together with the fan, so the light
  // button is disabled while the fan is off. Set to true for fans whose light
  // works on its own. Defaults to false.
  light_independent?: boolean;
}

export type EntityRole = "light" | "timer" | "sound";

export const ENTITY_ROLES: readonly EntityRole[] = ["light", "timer", "sound"];

export interface ResolvedEntities {
  fan: string;
  light?: string;
  timer?: string;
  sound?: string;
}

export const TIMER_OPTIONS_MIN = [0, 15, 30, 60, 120, 240, 480] as const;

// Speed count used when the fan does not report a usable percentage_step
// (and the count the named speed labels were written for).
export const DEFAULT_SPEED_COUNT = 6;

// Above this many steps the fan is effectively continuous (HA defaults
// speed_count to 100): a segmented bar would be unusable, so the card falls
// back to DEFAULT_SPEED_COUNT segments, which still map to valid percentages.
export const MAX_SPEED_SEGMENTS = 10;

/**
 * Number of discrete speeds of a fan, derived from the `percentage_step`
 * attribute HA publishes (100 / speed_count).
 */
export function speedCount(fanState: HassEntity | undefined): number {
  const step = Number(fanState?.attributes?.percentage_step);
  if (!Number.isFinite(step) || step <= 0) return DEFAULT_SPEED_COUNT;
  const count = Math.round(100 / step);
  return count >= 1 && count <= MAX_SPEED_SEGMENTS ? count : DEFAULT_SPEED_COUNT;
}

export function percentageToSpeed(
  pct: number | null | undefined,
  count: number = DEFAULT_SPEED_COUNT,
): number {
  if (!pct || pct <= 0) return 0;
  return Math.min(count, Math.max(1, Math.round(pct / (100 / count))));
}

/** Percentage shown to the user for a speed (17 / 33 / 50 / 67 / 83 / 100 on 6 speeds). */
export function speedToPercentage(speed: number, count: number = DEFAULT_SPEED_COUNT): number {
  if (speed <= 0) return 0;
  return Math.round((speed / count) * 100);
}

/**
 * Percentage sent to fan.set_percentage for a speed. Rounded down, like the HA
 * frontend and HA's own ordered-list helper (upper bound of each speed is
 * floor(n * 100 / count)): 67 % on a 3-speed fan would otherwise be read as
 * speed 3 by integrations that bucket with ceil or ordered lists.
 */
export function speedToCommandPercentage(
  speed: number,
  count: number = DEFAULT_SPEED_COUNT,
): number {
  if (speed <= 0) return 0;
  return Math.min(100, Math.floor((speed * 100) / count));
}

// States in which the fan must not be treated as running: "unknown" (e.g.
// right after a restart, or a template fan whose source is missing) is as
// little "on" as "off" is.
export const OFF_LIKE_STATES: ReadonlySet<string> = new Set(["off", "unavailable", "unknown"]);

// States in which the fan cannot be controlled at all.
export const UNAVAILABLE_STATES: ReadonlySet<string> = new Set(["unavailable", "unknown"]);

export function isFanOn(fanState: HassEntity | undefined): fanState is HassEntity {
  return fanState !== undefined && !OFF_LIKE_STATES.has(fanState.state);
}

export function isFanUnavailable(fanState: HassEntity | undefined): boolean {
  return fanState !== undefined && UNAVAILABLE_STATES.has(fanState.state);
}

// homeassistant/components/fan/const.py — class FanEntityFeature(IntFlag).
export const FanFeature = {
  SET_SPEED: 1,
  OSCILLATE: 2,
  DIRECTION: 4,
  PRESET_MODE: 8,
  TURN_OFF: 16,
  TURN_ON: 32,
} as const;

export function fanSupports(fanState: HassEntity | undefined, feature: number): boolean {
  const features = Number(fanState?.attributes?.supported_features ?? 0);
  return (features & feature) !== 0;
}

export function fanSupportsDirection(fanState: HassEntity | undefined): boolean {
  return fanSupports(fanState, FanFeature.DIRECTION);
}

export const BRIDGE_PLATFORM = "fan_bridge";

/**
 * Whether an entity is a fan created by the FanBridge integration.
 *
 * The entity registry says so even while the fan is unavailable: Home
 * Assistant drops the extra attributes (using_backup among them) of an
 * unavailable entity, so they are only a fallback for an instance whose
 * registry the frontend does not expose.
 */
export function isBridgeFan(hass: HomeAssistant | undefined, entityId: string | undefined): boolean {
  if (!entityId) return false;
  const entry = hass?.entities?.[entityId];
  if (entry) return entry.platform === BRIDGE_PLATFORM;
  return typeof hass?.states?.[entityId]?.attributes?.using_backup === "boolean";
}

/**
 * Find the light, timer and beep entities of a FanBridge fan: the ones the
 * integration created on the same device, told apart by their translation key.
 * This follows renamed entity ids, which a name-based search would not.
 */
export function resolveEntities(
  hass: HomeAssistant | undefined,
  config: Pick<FanBridgeCardConfig, "fan_entity">,
): ResolvedEntities {
  const resolved: ResolvedEntities = { fan: config.fan_entity };
  const registry = hass?.entities;
  const device = registry?.[config.fan_entity]?.device_id;
  if (!registry || !device) return resolved;
  for (const entry of Object.values(registry)) {
    if (entry.device_id !== device || entry.platform !== BRIDGE_PLATFORM) continue;
    const role = entry.translation_key as EntityRole | undefined;
    if (role && ENTITY_ROLES.includes(role) && !resolved[role]) resolved[role] = entry.entity_id;
  }
  return resolved;
}
