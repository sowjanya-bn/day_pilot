from datetime import date as dt_date, datetime as dt_datetime
from typing import Optional

from sqlmodel import Field, SQLModel


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