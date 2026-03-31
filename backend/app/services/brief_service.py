from datetime import date, timedelta

from fastapi import HTTPException, status
from sqlmodel import Session

from app.models.brief import DailyBriefResponse
from app.services import checkin_service, planner_service
from app.services.guidance_service import get_carry_forward
from app.services.stats_service import get_daily_stats
from app.services.task_service import list_tasks_for_day


def get_daily_brief(session: Session, day: date) -> DailyBriefResponse:
    try:
        plan = planner_service.get_plan(session, day)
    except HTTPException as exc:
        if exc.status_code == status.HTTP_404_NOT_FOUND:
            plan = None
        else:
            raise

    try:
        yesterday = checkin_service.get_checkin(session, day - timedelta(days=1))
    except HTTPException as exc:
        if exc.status_code == status.HTTP_404_NOT_FOUND:
            yesterday = None
        else:
            raise

    guidance = get_carry_forward(session, day)
    stats = get_daily_stats(session, day)
    tasks = list_tasks_for_day(session, day)

    return DailyBriefResponse(
        date=day,
        plan=plan,
        yesterday_reflection=yesterday,
        guidance=guidance,
        stats=stats,
        tasks=tasks,
    )