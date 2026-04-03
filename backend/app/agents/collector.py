from __future__ import annotations

from collections import Counter
from datetime import date, timedelta

from sqlmodel import Session, select

from app.agents.schemas import DailyContext, RollingStats
from app.models.task import TaskStatus
from app.models.entities import TaskEntity


class ContextCollector:
    def __init__(self, stale_threshold_days: int = 3) -> None:
        self.stale_threshold_days = stale_threshold_days

    def collect(self, session: Session, target_date: date) -> DailyContext:
        window_start = target_date - timedelta(days=6)

        recent_tasks = session.exec(
            select(TaskEntity).where(TaskEntity.assigned_date >= window_start, TaskEntity.assigned_date <= target_date)
        ).all()

        open_tasks = session.exec(select(TaskEntity).where(TaskEntity.status == TaskStatus.PLANNED)).all()

        today_task_ids = [task.id for task in recent_tasks if task.assigned_date == target_date and task.id is not None]
        open_task_ids = [task.id for task in open_tasks if task.id is not None]

        stale_cutoff = target_date - timedelta(days=self.stale_threshold_days)
        stale_task_ids = [
            task.id
            for task in open_tasks
            if task.id is not None and task.assigned_date <= stale_cutoff
        ]

        completed_today_ids = [
            task.id
            for task in recent_tasks
            if task.id is not None
            and task.completed_at is not None
            and task.completed_at.date() == target_date
        ]

        category_open_counts = Counter(task.category or "uncategorized" for task in open_tasks)
        category_completed_counts = Counter(
            (task.category or "uncategorized")
            for task in recent_tasks
            if task.status == TaskStatus.COMPLETED
        )

        planned_count = len(recent_tasks)
        completed_count = sum(1 for task in recent_tasks if task.status == TaskStatus.COMPLETED)
        open_count = len(open_tasks)
        completion_ratio = completed_count / planned_count if planned_count else 0.0

        return DailyContext(
            date=target_date,
            today_task_ids=today_task_ids,
            open_task_ids=open_task_ids,
            stale_task_ids=stale_task_ids,
            completed_today_ids=completed_today_ids,
            category_open_counts=dict(category_open_counts),
            category_completed_counts=dict(category_completed_counts),
            rolling_7d=RollingStats(
                planned_count=planned_count,
                completed_count=completed_count,
                open_count=open_count,
                completion_ratio=completion_ratio,
            ),
        )
