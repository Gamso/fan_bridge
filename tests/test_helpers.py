"""Speed tables and conversions: they must match the card's."""
from __future__ import annotations

import pytest

from custom_components.fan_bridge.helpers import (
    parse_speed_percentages,
    percentage_to_speed,
    speed_count,
    speed_to_command_percentage,
)

TABLE = [1, 21, 41, 60, 80, 100]


def test_parse_accepts_lists_and_text():
    assert parse_speed_percentages(TABLE) == TABLE
    assert parse_speed_percentages("1, 21 41;60,80 ,100") == TABLE


@pytest.mark.parametrize("bad", ["", "1, x", [3, 2], [0, 5], [10, 200], [], None, "1,1", [1.5, 2], list(range(1, 12))])
def test_parse_rejects_invalid_lists(bad):
    assert parse_speed_percentages(bad) is None


def test_speed_count_follows_percentage_step():
    assert speed_count(16.666666) == 6
    assert speed_count(25) == 4
    assert speed_count(1) == 6  # a continuous fan falls back to six speeds
    assert speed_count(None) == 6
    assert speed_count("x") == 6


def test_percentage_to_speed_without_table():
    assert [percentage_to_speed(p, 6) for p in (0, None, 16, 17, 33, 50, 66, 83, 100)] == [0, 0, 1, 1, 2, 3, 4, 5, 6]


def test_percentage_to_speed_with_table_takes_the_highest_speed_not_above():
    assert [percentage_to_speed(p, 6, TABLE) for p in (0, 1, 20, 21, 59, 60, 79, 80, 100)] == [0, 1, 1, 2, 3, 4, 4, 5, 6]


def test_command_percentage():
    assert [speed_to_command_percentage(s, 6) for s in range(7)] == [0, 16, 33, 50, 66, 83, 100]
    assert [speed_to_command_percentage(s, 6, TABLE) for s in range(7)] == [0, *TABLE]
