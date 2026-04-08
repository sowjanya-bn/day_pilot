from datetime import date as dt_date

from app.models.context import FocusItem


def _score_task(task: dict, target_date: dt_date) -> float:
    score = 0.0

    priority = task.get("priority")
    if priority is not None:
        score += float(priority) * 2.0

    defer_count = task.get("defer_count", 0) or 0
    score += float(defer_count) * 1.5

    age_days = task.get("age_days", 0)
    if age_days > 0:
        score += min(age_days * 0.2, 2.0)

    if task.get("is_today", False):
        score += 1.5

    return score


def _focus_reason(task: dict) -> str:
    priority = task.get("priority")
    defer_count = task.get("defer_count", 0) or 0

    if priority is not None and defer_count >= 2:
        return "High priority and repeatedly deferred"
    if priority is not None:
        return "High priority"
    if defer_count >= 2:
        return "Repeatedly deferred"
    if task.get("is_older_than_today", False):
        return "Still pending from an earlier day"
    return "Worth focusing on today"


def select_focus_tasks(
    tasks: list[dict],
    max_focus: int,
    target_date: dt_date,
) -> list[FocusItem]:
    active_tasks = [task for task in tasks if task.get("is_active", False)]

    ranked = sorted(
        active_tasks,
        key=lambda task: _score_task(task, target_date),
        reverse=True,
    )

    focus_tasks = ranked[:max_focus]

    return [
        FocusItem(
            task_id=task["id"],
            title=task["title"],
            reason=_focus_reason(task),
            score=_score_task(task, target_date),
        )
        for task in focus_tasks
    ]