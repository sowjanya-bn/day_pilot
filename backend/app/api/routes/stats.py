from datetime import date

from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.db import get_session
from app.models.stats import DailyStatsResponse
from app.services.stats_service import get_daily_stats

router = APIRouter(tags=["stats"])


@router.get("/stats/{day}", response_model=DailyStatsResponse)
def daily_stats(
    day: date,
    session: Session = Depends(get_session),
) -> DailyStatsResponse:
    return get_daily_stats(session, day)