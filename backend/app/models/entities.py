from datetime import date as dt_date, datetime as dt_datetime
from typing import Optional

from sqlmodel import Field, SQLModel


class TaskEntity(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

    title: str
    category: str = Field(default="general", index=True)
    status: str = Field(default="outstanding", index=True)

    source: str = Field(default="manual")

    created_at: dt_datetime = Field(default_factory=dt_datetime.utcnow)
    updated_at: dt_datetime = Field(default_factory=dt_datetime.utcnow)
    completed_at: Optional[dt_datetime] = None


class PlanTaskLinkEntity(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

    plan_id: int = Field(index=True)
    task_id: int = Field(index=True)

    role: str = Field(default="priority")  # optional semantic role

    created_at: dt_datetime = Field(default_factory=dt_datetime.utcnow)


class CheckinTaskLinkEntity(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

    checkin_id: int = Field(index=True)
    task_id: int = Field(index=True)

    update_type: str = Field(default="mentioned")  # completed / incomplete / mentioned

    created_at: dt_datetime = Field(default_factory=dt_datetime.utcnow)


class TomorrowPlanEntity(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    date: dt_date = Field(index=True, unique=True)
    agenda: Optional[str] = None
    top_priorities_json: str = "[]"
    learning_goal: Optional[str] = None
    job_goal: Optional[str] = None
    social_goal: Optional[str] = None
    created_at: dt_datetime = Field(default_factory=dt_datetime.utcnow)
    updated_at: dt_datetime = Field(default_factory=dt_datetime.utcnow)


class DailyCheckinEntity(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    date: dt_date = Field(index=True, unique=True)
    completed_json: str = "[]"
    incomplete_json: str = "[]"
    blockers_json: str = "[]"
    carry_forward_json: str = "[]"
    learned: Optional[str] = None
    small_win: Optional[str] = None
    mood: str = "steady"
    notes: Optional[str] = None
    created_at: dt_datetime = Field(default_factory=dt_datetime.utcnow)