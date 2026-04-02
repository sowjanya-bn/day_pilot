from __future__ import annotations

from datetime import date

from fastapi import APIRouter, Depends
from sqlmodel import Session

from agents import AgentReport
from agents import AgentService

router = APIRouter(prefix="/agent", tags=["agent"])


def get_session() -> Session:
    raise NotImplementedError("Replace get_session with your application's real session dependency")


@router.get("/daily-insights", response_model=AgentReport)
def get_daily_insights(
    target_date: date,
    session: Session = Depends(get_session),
) -> AgentReport:
    service = AgentService()
    return service.generate_daily_report(session=session, target_date=target_date)
