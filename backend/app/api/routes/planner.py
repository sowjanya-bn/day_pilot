from fastapi import APIRouter

from app.models.planner import TomorrowPlanCreate, TomorrowPlanResponse
from app.services.store import store

router = APIRouter(tags=["planner"])


@router.post("/planner", response_model=TomorrowPlanResponse)
def create_tomorrow_plan(payload: TomorrowPlanCreate) -> dict:
    return store.add_plan(payload.model_dump())


@router.get("/planner", response_model=list[TomorrowPlanResponse])
def list_tomorrow_plans() -> list[dict]:
    return store.list_plans()
