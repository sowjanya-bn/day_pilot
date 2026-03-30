from datetime import date, timedelta

from sqlmodel import Session

from app.models.brief import DailyBriefResponse
from app.services import planner_service, checkin_service
from app.services.guidance_service import get_carry_forward


def get_daily_brief(session: Session, day: date) -> DailyBriefResponse:
    try:
        plan = planner_service.get_plan(session, day)
    except:
        plan = None

    try:
        yesterday = checkin_service.get_checkin(session, day - timedelta(days=1))
    except:
        yesterday = None

    guidance = get_carry_forward(session, day)

    return DailyBriefResponse(
        date=day,
        plan=plan,
        yesterday_reflection=yesterday,
        guidance=guidance,
    )