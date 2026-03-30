from datetime import date

from fastapi import HTTPException, status

from app.models.checkin import DailyCheckinCreate
from app.services.store import store


def create_checkin(payload: DailyCheckinCreate) -> dict:
    existing = store.get_checkin_by_date(payload.date)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Check-in already exists for {payload.date.isoformat()}",
        )

    return store.add_checkin(payload.model_dump(mode="json"))


def list_checkins() -> list[dict]:
    return store.list_checkins()


def get_checkin(day: date) -> dict:
    checkin = store.get_checkin_by_date(day)
    if not checkin:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No check-in found for {day.isoformat()}",
        )
    return checkin