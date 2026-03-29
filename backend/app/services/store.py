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

    def add_checkin(self, item: dict[str, Any]) -> dict[str, Any]:
        item = {"id": len(self._checkins) + 1, **item}
        self._checkins.append(item)
        return item

    def list_checkins(self) -> list[dict[str, Any]]:
        return self._checkins


store = InMemoryStore()
