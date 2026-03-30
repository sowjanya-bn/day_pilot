import json
from datetime import date, datetime

from fastapi import HTTPException, status
from sqlmodel import Session, select

from app.models.entities import TomorrowPlanEntity
from app.models.planner import (
    TomorrowPlanCreate,
    TomorrowPlanResponse,
    TomorrowPlanUpdate,
)


def _to_response(entity: TomorrowPlanEntity) -> TomorrowPlanResponse:
    return TomorrowPlanResponse(
        id=entity.id,
        date=entity.date,
        agenda=entity.agenda,
        top_priorities=json.loads(entity.top_priorities_json),
        learning_goal=entity.learning_goal,
        job_goal=entity.job_goal,
        social_goal=entity.social_goal,
    )


def create_plan(session: Session, payload: TomorrowPlanCreate) -> TomorrowPlanResponse:
    existing = session.exec(
        select(TomorrowPlanEntity).where(TomorrowPlanEntity.date == payload.date)
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Planner entry already exists for {payload.date.isoformat()}",
        )

    entity = TomorrowPlanEntity(
        date=payload.date,
        agenda=payload.agenda,
        top_priorities_json=json.dumps(payload.top_priorities),
        learning_goal=payload.learning_goal,
        job_goal=payload.job_goal,
        social_goal=payload.social_goal,
    )
    session.add(entity)
    session.commit()
    session.refresh(entity)
    return _to_response(entity)


def list_plans(session: Session) -> list[TomorrowPlanResponse]:
    rows = session.exec(select(TomorrowPlanEntity).order_by(TomorrowPlanEntity.date)).all()
    return [_to_response(row) for row in rows]


def get_plan(session: Session, day: date) -> TomorrowPlanResponse:
    entity = session.exec(
        select(TomorrowPlanEntity).where(TomorrowPlanEntity.date == day)
    ).first()
    if not entity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No planner entry found for {day.isoformat()}",
        )
    return _to_response(entity)


def update_plan(session: Session, day: date, payload: TomorrowPlanUpdate) -> TomorrowPlanResponse:
    entity = session.exec(
        select(TomorrowPlanEntity).where(TomorrowPlanEntity.date == day)
    ).first()
    if not entity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No planner entry found for {day.isoformat()}",
        )

    updates = payload.model_dump(exclude_unset=True)
    if "agenda" in updates:
        entity.agenda = updates["agenda"]
    if "top_priorities" in updates:
        entity.top_priorities_json = json.dumps(updates["top_priorities"])
    if "learning_goal" in updates:
        entity.learning_goal = updates["learning_goal"]
    if "job_goal" in updates:
        entity.job_goal = updates["job_goal"]
    if "social_goal" in updates:
        entity.social_goal = updates["social_goal"]

    entity.updated_at = datetime.utcnow()

    session.add(entity)
    session.commit()
    session.refresh(entity)
    return _to_response(entity)