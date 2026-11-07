"""Pure helpers: speed tables and speed/percentage conversions.

These mirror the card's logic (src/types.ts) so the integration and the card
read and send the same percentages.
"""
from __future__ import annotations

import math
import re
from typing import Any

from .const import DEFAULT_SPEED_COUNT, MAX_SPEED_COUNT


def parse_speed_percentages(value: Any) -> list[int] | None:
    """Return a valid list of speed percentages, or None.

    Valid means: 1 to MAX_SPEED_COUNT strictly increasing integers in 1..100.
    A string is split on commas, semicolons and spaces. Anything else is
    ignored so a typo falls back to the fan's own percentage_step.
    """
    if isinstance(value, str):
        raw: Any = [part for part in re.split(r"[\s,;]+", value) if part]
    else:
        raw = value
    if not isinstance(raw, (list, tuple)) or not 0 < len(raw) <= MAX_SPEED_COUNT:
        return None
    try:
        numbers = [float(item) for item in raw]
    except (TypeError, ValueError):
        return None
    if any(n != int(n) or not 1 <= n <= 100 for n in numbers):
        return None
    result = [int(n) for n in numbers]
    if any(b <= a for a, b in zip(result, result[1:], strict=False)):
        return None
    return result


def speed_count(percentage_step: Any) -> int:
    """Number of discrete speeds of a fan, from its percentage_step attribute."""
    try:
        step = float(percentage_step)
    except (TypeError, ValueError):
        return DEFAULT_SPEED_COUNT
    if not math.isfinite(step) or step <= 0:
        return DEFAULT_SPEED_COUNT
    count = round(100 / step)
    return count if 1 <= count <= MAX_SPEED_COUNT else DEFAULT_SPEED_COUNT


def percentage_to_speed(percentage: Any, count: int, table: list[int] | None = None) -> int:
    """Speed (1-based, 0 = stopped) of a percentage reported by a fan."""
    try:
        pct = float(percentage)
    except (TypeError, ValueError):
        return 0
    if pct <= 0:
        return 0
    if table:
        speed = 1
        for index, lower in enumerate(table):
            if pct >= lower:
                speed = index + 1
        return speed
    return min(count, max(1, round(pct / (100 / count))))


def speed_to_command_percentage(speed: int, count: int, table: list[int] | None = None) -> int:
    """Percentage to send to a fan to get a speed.

    Rounded down without a table, like HA's own ordered-list helper, so
    integrations that bucket with ceil read it as the right speed.
    """
    if speed <= 0:
        return 0
    if table:
        return table[min(speed, len(table)) - 1]
    return min(100, math.floor(speed * 100 / count))
