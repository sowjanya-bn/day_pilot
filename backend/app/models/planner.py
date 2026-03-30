from datetime import date
from typing import Optional

from pydantic import BaseModel, Field, field_validator


class TomorrowPlanCreate(BaseModel):
    date: date
    agenda: Optional[str] = None
    top_priorities: list[str] = Field(default_factory=list)
    learning_goal: Optional[str] = None
    job_goal: Optional[str] = None
    social_goal: Optional[str] = None

    @field_validator("top_priorities")
    @classmethod
    def clean_priorities(cls, value: list[str]) -> list[str]:
        cleaned = [item.strip() for item in value if item.strip()]
        if len(cleaned) > 3:
            raise ValueError("Top priorities can have at most 3 items.")
        if len(set(cleaned)) != len(cleaned):
            raise ValueError("Top priorities must be unique.")
        return cleaned


class TomorrowPlanUpdate(BaseModel):
    agenda: Optional[str] = None
    top_priorities: Optional[list[str]] = None
    learning_goal: Optional[str] = None
    job_goal: Optional[str] = None
    social_goal: Optional[str] = None

    @field_validator("top_priorities")
    @classmethod
    def clean_priorities(cls, value: Optional[list[str]]) -> Optional[list[str]]:
        if value is None:
            return value
        cleaned = [item.strip() for item in value if item.strip()]
        if len(cleaned) > 3:
            raise ValueError("Top priorities can have at most 3 items.")
        if len(set(cleaned)) != len(cleaned):
            raise ValueError("Top priorities must be unique.")
        return cleaned


class TomorrowPlanResponse(TomorrowPlanCreate):
    id: int