from datetime import date

from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.db import get_session
from app.models.brief import DailyBriefResponse
from app.services.brief_service import get_daily_brief

router = APIRouter(tags=["brief"])


@router.get("/daily-brief/{day}", response_model=DailyBriefResponse)
def daily_brief(
    day: date,
    session: Session = Depends(get_session),
) -> DailyBriefResponse:
    return get_daily_brief(session, day)