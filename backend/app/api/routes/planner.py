from datetime import date

from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.db import get_session
from app.models.planner import (
    TomorrowPlanCreate,
    TomorrowPlanResponse,
    TomorrowPlanUpdate,
)
from app.services import planner_service

router = APIRouter(tags=["planner"])


@router.post("/planner", response_model=TomorrowPlanResponse, status_code=201)
def create_tomorrow_plan(
    payload: TomorrowPlanCreate,
    session: Session = Depends(get_session),
) -> TomorrowPlanResponse:
    return planner_service.create_plan(session, payload)


@router.get("/planner", response_model=list[TomorrowPlanResponse])
def list_tomorrow_plans(
    session: Session = Depends(get_session),
) -> list[TomorrowPlanResponse]:
    return planner_service.list_plans(session)


@router.get("/planner/{day}", response_model=TomorrowPlanResponse)
def get_tomorrow_plan(
    day: date,
    session: Session = Depends(get_session),
) -> TomorrowPlanResponse:
    return planner_service.get_plan(session, day)


@router.put("/planner/{day}", response_model=TomorrowPlanResponse)
def update_tomorrow_plan(
    day: date,
    payload: TomorrowPlanUpdate,
    session: Session = Depends(get_session),
) -> TomorrowPlanResponse:
    return planner_service.update_plan(session, day, payload)