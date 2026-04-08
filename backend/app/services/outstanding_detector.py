from datetime import date as dt_date

from app.models.context import OutstandingItem


def _outstanding_note(task: dict) -> str:
    defer_count = task.get("defer_count", 0) or 0

    if defer_count >= 2:
        return "Deferred multiple times"
    if task.get("is_older_than_today", False):
        return "Still open from a previous day"
    return "Still pending"


def detect_outstanding_tasks(
    tasks: list[dict],
    max_outstanding: int,
    target_date: dt_date,
) -> list[OutstandingItem]:
    candidates = [
        task
        for task in tasks
        if task.get("is_active", False)
        and (
            task.get("is_older_than_today", False)
            or (task.get("defer_count", 0) or 0) >= 2
        )
    ]

    candidates = sorted(
        candidates,
        key=lambda task: (
            task.get("defer_count", 0) or 0,
            task.get("age_days", 0),
        ),
        reverse=True,
    )

    selected = candidates[:max_outstanding]

    return [
        OutstandingItem(
            task_id=task["id"],
            title=task["title"],
            note=_outstanding_note(task),
        )
        for task in selected
    ]