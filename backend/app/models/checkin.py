from typing import Optional

from pydantic import BaseModel, Field


class DailyCheckinCreate(BaseModel):
    date: str = Field(..., description="Date in YYYY-MM-DD format")
    completed: list[str] = Field(default_factory=list)
    incomplete: list[str] = Field(default_factory=list)
    blockers: list[str] = Field(default_factory=list)
    carry_forward: list[str] = Field(default_factory=list)
    notes: Optional[str] = None


class DailyCheckinResponse(DailyCheckinCreate):
    id: int
