from typing import Optional

from pydantic import BaseModel, Field


class TomorrowPlanCreate(BaseModel):
    date: str = Field(..., description="Date in YYYY-MM-DD format")
    agenda: str
    top_priorities: list[str] = Field(default_factory=list)
    learning_goal: Optional[str] = None
    social_goal: Optional[str] = None


class TomorrowPlanResponse(TomorrowPlanCreate):
    id: int
