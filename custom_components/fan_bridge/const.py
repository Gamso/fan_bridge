"""Constants for the FanBridge integration."""
from __future__ import annotations

DOMAIN = "fan_bridge"

# Config entry keys. The creation flow stores the name and the main fan; the
# options flow stores the rest. Both are read merged (options win).
CONF_NAME = "name"
CONF_FAN = "fan_entity"
CONF_FALLBACK_FAN = "fallback_fan_entity"
CONF_LIGHT = "light_entity"
CONF_FALLBACK_LIGHT = "fallback_light_entity"
CONF_TIMER = "timer_entity"
CONF_FALLBACK_TIMER = "fallback_timer_entity"
CONF_SOUND = "sound_entity"
CONF_FALLBACK_SOUND = "fallback_sound_entity"
CONF_SPEEDS = "speed_percentages"
CONF_FALLBACK_SPEEDS = "fallback_speed_percentages"
CONF_REMOTES = "remotes"
CONF_RELOAD_MAIN = "reload_main"
CONF_PRESENCE = "presence_entity"

# Keys of one remote mapping.
CONF_REMOTE_SOURCE = "source"
CONF_REMOTE_TOPIC = "topic"
CONF_REMOTE_ENTITY = "entity_id"
CONF_REMOTE_PAYLOAD = "payload"
CONF_REMOTE_ACTION = "action"
CONF_REMOTE_SPEED = "speed"

# Where a remote button press comes from.
SOURCE_MQTT = "mqtt"
SOURCE_ENTITY = "entity"
REMOTE_SOURCES = (SOURCE_MQTT, SOURCE_ENTITY)

# What a remote button can do. Every action goes through the merged entities,
# so the backup fan, the speed tables and the availability rules all apply.
ACTION_FAN_TOGGLE = "fan_toggle"
ACTION_FAN_ON = "fan_on"
ACTION_FAN_OFF = "fan_off"
ACTION_SPEED_UP = "speed_up"
ACTION_SPEED_DOWN = "speed_down"
ACTION_SET_SPEED = "set_speed"
ACTION_LIGHT_TOGGLE = "light_toggle"
ACTION_LIGHT_ON = "light_on"
ACTION_LIGHT_OFF = "light_off"
ACTION_DIRECTION_TOGGLE = "direction_toggle"
ACTION_DIRECTION_FORWARD = "direction_forward"
ACTION_DIRECTION_REVERSE = "direction_reverse"
ACTION_OSCILLATE_TOGGLE = "oscillate_toggle"
ACTION_PRESET_NEXT = "preset_next"
ACTION_SOUND_TOGGLE = "sound_toggle"
REMOTE_ACTIONS = (
    ACTION_FAN_TOGGLE,
    ACTION_FAN_ON,
    ACTION_FAN_OFF,
    ACTION_SPEED_UP,
    ACTION_SPEED_DOWN,
    ACTION_SET_SPEED,
    ACTION_LIGHT_TOGGLE,
    ACTION_LIGHT_ON,
    ACTION_LIGHT_OFF,
    ACTION_DIRECTION_TOGGLE,
    ACTION_DIRECTION_FORWARD,
    ACTION_DIRECTION_REVERSE,
    ACTION_OSCILLATE_TOGGLE,
    ACTION_PRESET_NEXT,
    ACTION_SOUND_TOGGLE,
)

# States in which an entity cannot be used (same rule as the card).
UNAVAILABLE_STATES = frozenset({"unavailable", "unknown"})

# Speed count used when a fan does not report a usable percentage_step, and
# the ceiling above which a fan is considered continuous (HA defaults a fan's
# speed_count to 100).
DEFAULT_SPEED_COUNT = 6
MAX_SPEED_COUNT = 10

# Presets offered by the timer select when the underlying timer is a number
# (minutes), same list as the card.
TIMER_PRESETS_MIN = (0, 15, 30, 60, 120, 240, 480)

# Delays (seconds) between two reloads of the main fan's integration while the
# backup is in charge; the last one repeats.
RELOAD_DELAYS = (120, 300, 600, 1800)
