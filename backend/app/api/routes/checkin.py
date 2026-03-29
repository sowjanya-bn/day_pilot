from datetime import date

from fastapi import APIRouter, HTTPException, status

from app.models.checkin import DailyCheckinCreate, DailyCheckinResponse
from app.services.store import store

router = APIRouter(tags=["checkin"])


@router.post("/checkin", response_model=DailyCheckinResponse)
def create_daily_checkin(payload: DailyCheckinCreate) -> dict:
    return store.add_checkin(payload.model_dump(mode="json"))


@router.get("/checkin", response_model=list[DailyCheckinResponse])
def list_daily_checkins() -> list[dict]:
    return store.list_checkins()


@router.get("/checkin/{day}", response_model=DailyCheckinResponse)
def get_daily_checkin(day: date) -> dict:
    checkin = store.get_checkin_by_date(day)
    if not checkin:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No check-in found for {day.isoformat()}",
        )
    return checkin