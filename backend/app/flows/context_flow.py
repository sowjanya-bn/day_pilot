from datetime import date as dt_date

from app.models.context import ContextTodayRequest, ContextTodayResponse
from app.services.briefing_composer import compose_briefing
from app.services.focus_selector import select_focus_tasks
from app.services.outstanding_detector import detect_outstanding_tasks
from app.services.news_enricher import maybe_get_news

def _parse_date(value: str) -> dt_date:
    return dt_date.fromisoformat(value)

def normalize_input(payload: ContextTodayRequest) -> dict:
    target_date = _parse_date(payload.date) if payload.date else dt_date.today()

    normalized_tasks = []
    for task in payload.tasks:
        assigned = _parse_date(task.assigned_date)
        normalized_tasks.append(
            {
                "id": task.id,
                "title": task.title,
                "status": task.status,
                "assigned_date": assigned,
                "category": task.category,
                "priority": task.priority,
                "defer_count": task.defer_count,
            }
        )

    return {
        "target_date": target_date,
        "tasks": normalized_tasks,
    }

def derive_task_signals(normalized: dict) -> list[dict]:
    target_date = normalized["target_date"]
    enriched_tasks: list[dict] = []

    for task in normalized["tasks"]:
        assigned_date = task["assigned_date"]
        age_days = max((target_date - assigned_date).days, 0)

        enriched_tasks.append(
            {
                **task,
                "is_active": task["status"] == "planned" and assigned_date <= target_date,
                "is_today": assigned_date == target_date,
                "is_older_than_today": assigned_date < target_date,
                "age_days": age_days,
                "is_high_priority": task["priority"] is not None,
                "is_repeatedly_deferred": (task["defer_count"] or 0) >= 2,
                "is_lingering": assigned_date < target_date or (task["defer_count"] or 0) >= 2,
            }
        )

    return enriched_tasks

async def run_context_flow(payload: ContextTodayRequest) -> ContextTodayResponse:
    normalized = normalize_input(payload)
    enriched_tasks = derive_task_signals(normalized)
    target_date = normalized["target_date"]

    focus = select_focus_tasks(
        tasks=enriched_tasks,
        max_focus=payload.max_focus,
        target_date=target_date,
    )

    outstanding = detect_outstanding_tasks(
        tasks=enriched_tasks,
        max_outstanding=payload.max_outstanding,
        target_date=target_date,
    )

    news = await maybe_get_news(
        include_news=payload.include_news,
        focus=focus,
        max_news=payload.max_news,
    )

    return compose_briefing(
        target_date=target_date,
        tasks=enriched_tasks,
        focus=focus,
        outstanding=outstanding,
        news=news,
    )