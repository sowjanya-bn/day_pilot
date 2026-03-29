from datetime import date
from typing import Optional

from pydantic import BaseModel, Field, field_validator


class TomorrowPlanCreate(BaseModel):
    date: date
    agenda: Optional[str] = None
    top_priorities: list[str] = Field(default_factory=list, max_length=3)
    learning_goal: Optional[str] = None
    job_goal: Optional[str] = None
    social_goal: Optional[str] = None

    @field_validator("top_priorities")
    @classmethod
    def clean_priorities(cls, value: list[str]) -> list[str]:
        cleaned = [item.strip() for item in value if item.strip()]
        if len(set(cleaned)) != len(cleaned):
            raise ValueError("Top priorities must be unique.")
        return cleaned


class TomorrowPlanResponse(TomorrowPlanCreate):
    id: int