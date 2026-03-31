import json
from datetime import date

from fastapi import HTTPException, status
from sqlmodel import Session, select

from app.models.checkin import DailyCheckinCreate, DailyCheckinResponse
from app.models.entities import DailyCheckinEntity

from app.services.task_service import create_or_get_task, mark_task_completed
from app.models.entities import CheckinTaskLinkEntity


def _to_response(entity: DailyCheckinEntity) -> DailyCheckinResponse:
    return DailyCheckinResponse(
        id=entity.id,
        date=entity.date,
        completed=json.loads(entity.completed_json),
        incomplete=json.loads(entity.incomplete_json),
        blockers=json.loads(entity.blockers_json),
        carry_forward=json.loads(entity.carry_forward_json),
        learned=entity.learned,
        small_win=entity.small_win,
        mood=entity.mood,
        notes=entity.notes,
    )


def create_checkin(session: Session, payload: DailyCheckinCreate) -> DailyCheckinResponse:
    existing = session.exec(
        select(DailyCheckinEntity).where(DailyCheckinEntity.date == payload.date)
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Check-in already exists for {payload.date.isoformat()}",
        )

    entity = DailyCheckinEntity(
        date=payload.date,
        completed_json=json.dumps(payload.completed),
        incomplete_json=json.dumps(payload.incomplete),
        blockers_json=json.dumps(payload.blockers),
        carry_forward_json=json.dumps(payload.carry_forward),
        learned=payload.learned,
        small_win=payload.small_win,
        mood=payload.mood.value,
        notes=payload.notes,
    )
    session.add(entity)

    for item in payload.completed:
        task = create_or_get_task(
            session,
            title=item,
            category="general",
            source="checkin",
        )

        mark_task_completed(session, task)

        link = CheckinTaskLinkEntity(
            checkin_id=entity.id,
            task_id=task.id,
            update_type="completed",
        )

        session.add(link)

    for item in payload.incomplete:
        task = create_or_get_task(
            session,
            title=item,
            category="general",
            source="checkin",
        )

        link = CheckinTaskLinkEntity(
            checkin_id=entity.id,
            task_id=task.id,
            update_type="incomplete",
        )

        session.add(link)


    session.commit()
    session.refresh(entity)
    return _to_response(entity)


def list_checkins(session: Session) -> list[DailyCheckinResponse]:
    rows = session.exec(select(DailyCheckinEntity).order_by(DailyCheckinEntity.date)).all()
    return [_to_response(row) for row in rows]


def get_checkin(session: Session, day: date) -> DailyCheckinResponse:
    entity = session.exec(
        select(DailyCheckinEntity).where(DailyCheckinEntity.date == day)
    ).first()
    if not entity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No check-in found for {day.isoformat()}",
        )
    return _to_response(entity)


def get_previous_checkin_entity(session: Session, day: date) -> DailyCheckinEntity | None:
    return session.exec(
        select(DailyCheckinEntity).where(DailyCheckinEntity.date == day)
    ).first()