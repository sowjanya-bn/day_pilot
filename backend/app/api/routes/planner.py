from datetime import date

from fastapi import APIRouter, HTTPException, status

from app.models.planner import TomorrowPlanCreate, TomorrowPlanResponse
from app.services.store import store

router = APIRouter(tags=["planner"])


@router.post("/planner", response_model=TomorrowPlanResponse)
def create_tomorrow_plan(payload: TomorrowPlanCreate) -> dict:
    return store.add_plan(payload.model_dump(mode="json"))


@router.get("/planner", response_model=list[TomorrowPlanResponse])
def list_tomorrow_plans() -> list[dict]:
    return store.list_plans()


@router.get("/planner/{day}", response_model=TomorrowPlanResponse)
def get_tomorrow_plan(day: date) -> dict:
    plan = store.get_plan_by_date(day)
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No planner entry found for {day.isoformat()}",
        )
    return plan