from datetime import date as dt_date

from app.models.context import (
    ContextTodayRequest,
    ContextTodayResponse,
    FocusItem,
    InputTask,
    OutstandingItem,
)


def _parse_date(value: str) -> dt_date:
    return dt_date.fromisoformat(value)


def _score_task(task: InputTask, target_date: dt_date) -> float:
    score = 0.0

    if task.priority is not None:
        score += float(task.priority) * 2.0

    score += float(task.defer_count) * 1.5

    assigned = _parse_date(task.assigned_date)
    age_days = (target_date - assigned).days
    if age_days > 0:
        score += min(age_days * 0.2, 2.0)

    if assigned == target_date:
        score += 1.0

    return score


def _focus_reason(task: InputTask, target_date: dt_date) -> str:
    assigned = _parse_date(task.assigned_date)

    if task.priority is not None and task.defer_count >= 2:
        return "High priority and repeatedly deferred"
    if task.priority is not None:
        return "High priority"
    if task.defer_count >= 2:
        return "Repeatedly deferred"
    if assigned < target_date:
        return "Still pending from an earlier day"
    return "Worth focusing on today"


def _outstanding_note(task: InputTask, target_date: dt_date) -> str:
    assigned = _parse_date(task.assigned_date)

    if task.defer_count >= 2:
        return "Deferred multiple times"
    if assigned < target_date:
        return "Still open from a previous day"
    return "Still pending"


def build_today_context(payload: ContextTodayRequest) -> ContextTodayResponse:
    target_date = (
        dt_date.fromisoformat(payload.date)
        if payload.date
        else dt_date.today()
    )

    pending_tasks = [
        task
        for task in payload.tasks
        if task.status == "planned" and _parse_date(task.assigned_date) <= target_date
    ]

    ranked = sorted(
        pending_tasks,
        key=lambda task: _score_task(task, target_date),
        reverse=True,
    )

    focus_tasks = ranked[: payload.max_focus]
    focus = [
        FocusItem(
            task_id=task.id,
            title=task.title,
            reason=_focus_reason(task, target_date),
            score=_score_task(task, target_date),
        )
        for task in focus_tasks
    ]

    outstanding_candidates = [
        task
        for task in pending_tasks
        if _parse_date(task.assigned_date) < target_date or task.defer_count >= 2
    ][: payload.max_outstanding]

    outstanding = [
        OutstandingItem(
            task_id=task.id,
            title=task.title,
            note=_outstanding_note(task, target_date),
        )
        for task in outstanding_candidates
    ]

    todays_tasks = [
        task
        for task in pending_tasks
        if _parse_date(task.assigned_date) == target_date
    ]

    if todays_tasks:
        if focus:
            summary_line = (
                f"Good day. You have {len(todays_tasks)} tasks planned today, "
                f"with {focus[0].title} as the top focus."
            )
        else:
            summary_line = f"Good day. You have {len(todays_tasks)} tasks planned today."
    else:
        if outstanding:
            count = len(outstanding)
            summary_line = (
                f"Good day. No new tasks are planned for today, "
                f"but you have {count} lingering task"
                f"{'' if count == 1 else 's'} worth revisiting."
            )
        else:
            summary_line = "Good day. You have no planned tasks for today yet."

    nudge = None
    if outstanding:
        nudge = "Try closing out one lingering task before adding anything new."

    return ContextTodayResponse(
        date=target_date.isoformat(),
        summary_line=summary_line,
        focus=focus,
        outstanding=outstanding,
        news=[],
        nudge=nudge,
    )