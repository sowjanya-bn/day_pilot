import json
from datetime import date, timedelta

from sqlmodel import Session, select

from app.models.entities import DailyCheckinEntity, TomorrowPlanEntity
from app.models.stats import DailyStatsResponse


def _calculate_planning_streak(session: Session, day: date) -> int:
    streak = 0
    current_day = day

    while True:
        entry = session.exec(
            select(TomorrowPlanEntity).where(TomorrowPlanEntity.date == current_day)
        ).first()

        if not entry:
            break

        streak += 1
        current_day -= timedelta(days=1)

    return streak


def _calculate_checkin_streak(session: Session, day: date) -> int:
    streak = 0
    current_day = day

    while True:
        entry = session.exec(
            select(DailyCheckinEntity).where(DailyCheckinEntity.date == current_day)
        ).first()

        if not entry:
            break

        streak += 1
        current_day -= timedelta(days=1)

    return streak


def _count_tasks_last_7_days(session: Session, day: date) -> tuple[int, int]:
    start_day = day - timedelta(days=6)

    rows = session.exec(
        select(DailyCheckinEntity).where(
            DailyCheckinEntity.date >= start_day,
            DailyCheckinEntity.date <= day,
        )
    ).all()

    completed_count = 0
    incomplete_count = 0

    for row in rows:
        completed_count += len(json.loads(row.completed_json))
        incomplete_count += len(json.loads(row.incomplete_json))

    return completed_count, incomplete_count


def get_daily_stats(session: Session, day: date) -> DailyStatsResponse:
    planning_streak = _calculate_planning_streak(session, day)
    checkin_streak = _calculate_checkin_streak(session, day)
    completed_count, incomplete_count = _count_tasks_last_7_days(session, day)

    return DailyStatsResponse(
        date=day,
        planning_streak=planning_streak,
        checkin_streak=checkin_streak,
        completed_tasks_last_7_days=completed_count,
        incomplete_tasks_last_7_days=incomplete_count,
    )