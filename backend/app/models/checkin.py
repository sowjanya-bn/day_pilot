from datetime import date
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field, field_validator


class Mood(str, Enum):
    good = "good"
    steady = "steady"
    low = "low"
    overwhelmed = "overwhelmed"


class DailyCheckinCreate(BaseModel):
    date: date
    completed: list[str] = Field(default_factory=list)
    incomplete: list[str] = Field(default_factory=list)
    blockers: list[str] = Field(default_factory=list)
    carry_forward: list[str] = Field(default_factory=list)
    learned: Optional[str] = None
    small_win: Optional[str] = None
    mood: Mood = Mood.steady
    notes: Optional[str] = None

    @field_validator("completed", "incomplete", "blockers", "carry_forward")
    @classmethod
    def clean_lists(cls, value: list[str]) -> list[str]:
        return [item.strip() for item in value if item.strip()]


class DailyCheckinResponse(DailyCheckinCreate):
    id: int