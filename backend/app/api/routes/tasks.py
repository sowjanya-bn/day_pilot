from datetime import date

from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.db import get_session
from app.models.task import (
    DailyTaskCreate,
    DailyTaskListResponse,
    TaskResponse,
    TaskStatusUpdate,
)
from app.services import task_service

router = APIRouter(tags=["tasks"])


@router.post("/tasks", response_model=TaskResponse, status_code=201)
def create_task(
    payload: DailyTaskCreate,
    session: Session = Depends(get_session),
) -> TaskResponse:
    return task_service.create_task(session, payload)


@router.get("/tasks/{day}", response_model=DailyTaskListResponse)
def list_tasks_for_day(
    day: date,
    session: Session = Depends(get_session),
) -> DailyTaskListResponse:
    return task_service.list_tasks_for_day(session, day)


@router.put("/tasks/{task_id}/status", response_model=TaskResponse)
def update_task_status(
    task_id: int,
    payload: TaskStatusUpdate,
    session: Session = Depends(get_session),
) -> TaskResponse:
    return task_service.update_task_status(session, task_id, payload.status)