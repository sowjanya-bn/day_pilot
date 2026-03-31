from datetime import datetime

from sqlmodel import Session, select

from app.models.entities import TaskEntity
from app.models.task import TaskStatus
from datetime import date, datetime

from fastapi import HTTPException, status
from sqlmodel import Session, select

from app.models.entities import TaskEntity
from app.models.task import (
    DailyTaskListResponse,
    TaskResponse,
    TaskStatus,
)



def normalize_title(title: str) -> str:
    return title.strip().lower()


def find_existing_task(session: Session, title: str) -> TaskEntity | None:
    normalized = normalize_title(title)

    rows = session.exec(select(TaskEntity)).all()

    for task in rows:
        if normalize_title(task.title) == normalized:
            return task

    return None


def create_or_get_task(session: Session, title: str, category: str, source: str) -> TaskEntity:
    existing = find_existing_task(session, title)

    if existing:
        return existing

    task = TaskEntity(
        title=title.strip(),
        category=category,
        status=TaskStatus.outstanding.value,
        source=source,
    )

    session.add(task)
    session.commit()
    session.refresh(task)

    return task


def mark_task_completed(session: Session, task: TaskEntity):
    task.status = TaskStatus.completed.value
    task.completed_at = datetime.utcnow()
    task.updated_at = datetime.utcnow()

    session.add(task)
    session.commit()


def mark_task_outstanding(session: Session, task: TaskEntity):
    task.status = TaskStatus.outstanding.value
    task.updated_at = datetime.utcnow()

    session.add(task)
    session.commit()

def _to_response(entity: TaskEntity) -> TaskResponse:
    return TaskResponse(
        id=entity.id,
        title=entity.title,
        status=TaskStatus(entity.status),
        category=entity.category,
        source=entity.source,
        created_at=entity.created_at,
        updated_at=entity.updated_at,
        completed_at=entity.completed_at,
    )


def list_tasks_for_day(session: Session, day: date) -> DailyTaskListResponse:
    rows = session.exec(
        select(TaskEntity).order_by(TaskEntity.created_at)
    ).all()

    # For now, show all tasks that are still outstanding,
    # plus tasks completed on the given day.

    print(f"Total tasks in database: {rows}")
    outstanding = [
        _to_response(row)
        for row in rows
        if row.status == TaskStatus.outstanding.value
    ]

    completed = [
        _to_response(row)
        for row in rows
        if row.status == TaskStatus.completed.value
        and row.completed_at is not None
        and row.completed_at.date() == day
    ]

    print(f"Found {len(outstanding)} outstanding and {len(completed)} completed tasks for {day.isoformat()}")

    return DailyTaskListResponse(
        date=day,
        outstanding=outstanding,
        completed=completed,
    )

def update_task_status(
    session: Session,
    task_id: int,
    new_status: TaskStatus,
) -> TaskResponse:
    entity = session.get(TaskEntity, task_id)
    if not entity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No task found for id {task_id}",
        )

    entity.status = new_status.value
    entity.updated_at = datetime.utcnow()

    if new_status == TaskStatus.completed:
        entity.completed_at = datetime.utcnow()
    else:
        entity.completed_at = None

    session.add(entity)
    session.commit()
    session.refresh(entity)

    return _to_response(entity)