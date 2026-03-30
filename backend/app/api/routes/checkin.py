from datetime import date

from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.db import get_session
from app.models.checkin import DailyCheckinCreate, DailyCheckinResponse
from app.services import checkin_service

router = APIRouter(tags=["checkin"])


@router.post("/checkin", response_model=DailyCheckinResponse, status_code=201)
def create_daily_checkin(
    payload: DailyCheckinCreate,
    session: Session = Depends(get_session),
) -> DailyCheckinResponse:
    return checkin_service.create_checkin(session, payload)


@router.get("/checkin", response_model=list[DailyCheckinResponse])
def list_daily_checkins(
    session: Session = Depends(get_session),
) -> list[DailyCheckinResponse]:
    return checkin_service.list_checkins(session)


@router.get("/checkin/{day}", response_model=DailyCheckinResponse)
def get_daily_checkin(
    day: date,
    session: Session = Depends(get_session),
) -> DailyCheckinResponse:
    return checkin_service.get_checkin(session, day)