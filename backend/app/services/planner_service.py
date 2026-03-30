from datetime import date

from fastapi import HTTPException, status

from app.models.planner import TomorrowPlanCreate
from app.services.store import store


def create_plan(payload: TomorrowPlanCreate) -> dict:
    existing = store.get_plan_by_date(payload.date)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Planner entry already exists for {payload.date.isoformat()}",
        )

    return store.add_plan(payload.model_dump(mode="json"))


def list_plans() -> list[dict]:
    return store.list_plans()


def get_plan(day: date) -> dict:
    plan = store.get_plan_by_date(day)
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No planner entry found for {day.isoformat()}",
        )
    return plan