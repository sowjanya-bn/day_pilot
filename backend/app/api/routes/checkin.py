from fastapi import APIRouter

from app.models.checkin import DailyCheckinCreate, DailyCheckinResponse
from app.services.store import store

router = APIRouter(tags=["checkin"])


@router.post("/checkin", response_model=DailyCheckinResponse)
def create_daily_checkin(payload: DailyCheckinCreate) -> dict:
    return store.add_checkin(payload.model_dump())


@router.get("/checkin", response_model=list[DailyCheckinResponse])
def list_daily_checkins() -> list[dict]:
    return store.list_checkins()
