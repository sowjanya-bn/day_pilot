from datetime import date

from fastapi import APIRouter

from app.models.checkin import DailyCheckinCreate, DailyCheckinResponse
from app.services import checkin_service

router = APIRouter(tags=["checkin"])


@router.post("/checkin", response_model=DailyCheckinResponse)
def create_daily_checkin(payload: DailyCheckinCreate) -> dict:
    return checkin_service.create_checkin(payload)


@router.get("/checkin", response_model=list[DailyCheckinResponse])
def list_daily_checkins() -> list[dict]:
    return checkin_service.list_checkins()


@router.get("/checkin/{day}", response_model=DailyCheckinResponse)
def get_daily_checkin(day: date) -> dict:
    return checkin_service.get_checkin(day)