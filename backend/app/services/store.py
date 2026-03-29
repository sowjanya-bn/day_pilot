from datetime import date
from typing import Any


class InMemoryStore:
    """Simple temporary store for initial scaffold use.

    Replace this with SQLModel-based persistence once you are ready.
    """

    def __init__(self) -> None:
        self._planner_items: list[dict[str, Any]] = []
        self._checkins: list[dict[str, Any]] = []

    def add_plan(self, item: dict[str, Any]) -> dict[str, Any]:
        item = {"id": len(self._planner_items) + 1, **item}
        self._planner_items.append(item)
        return item

    def list_plans(self) -> list[dict[str, Any]]:
        return self._planner_items

    def get_plan_by_date(self, day: date) -> dict[str, Any] | None:
        day_str = day.isoformat()
        for item in self._planner_items:
            if item["date"] == day_str:
                return item
        return None

    def add_checkin(self, item: dict[str, Any]) -> dict[str, Any]:
        item = {"id": len(self._checkins) + 1, **item}
        self._checkins.append(item)
        return item

    def list_checkins(self) -> list[dict[str, Any]]:
        return self._checkins

    def get_checkin_by_date(self, day: date) -> dict[str, Any] | None:
        day_str = day.isoformat()
        for item in self._checkins:
            if item["date"] == day_str:
                return item
        return None


store = InMemoryStore()