from datetime import date as dt_date

from app.models.context import (
    ContextTodayResponse,
    FocusItem,
    NewsItem,
    OutstandingItem,
)


def compose_briefing(
    target_date: dt_date,
    tasks: list[dict],
    focus: list[FocusItem],
    outstanding: list[OutstandingItem],
    news: list[NewsItem],
) -> ContextTodayResponse:
    todays_tasks = [
        task for task in tasks
        if task.get("is_active", False) and task.get("is_today", False)
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
        news=news,
        nudge=nudge,
    )