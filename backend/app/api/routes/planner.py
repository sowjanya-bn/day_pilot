from datetime import date

from fastapi import APIRouter

from app.models.planner import TomorrowPlanCreate, TomorrowPlanResponse
from app.services import planner_service

router = APIRouter(tags=["planner"])


@router.post("/planner", response_model=TomorrowPlanResponse)
def create_tomorrow_plan(payload: TomorrowPlanCreate) -> dict:
    return planner_service.create_plan(payload)


@router.get("/planner", response_model=list[TomorrowPlanResponse])
def list_tomorrow_plans() -> list[dict]:
    return planner_service.list_plans()


@router.get("/planner/{day}", response_model=TomorrowPlanResponse)
def get_tomorrow_plan(day: date) -> dict:
    return planner_service.get_plan(day)