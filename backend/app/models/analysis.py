from typing import Literal

from pydantic import BaseModel


class TaskContext(BaseModel):
    id: int
    title: str
    status: Literal["planned", "completed", "cancelled"]
    category: str | None = None
    source: str | None = None


class DailyStatsContext(BaseModel):
    planned: int
    completed: int
    cancelled: int = 0


class DailyAnalysisRequest(BaseModel):
    date: str
    tasks: list[TaskContext]
    stats: DailyStatsContext


class Finding(BaseModel):
    type: str
    severity: Literal["low", "medium", "high"]
    title: str
    message: str


class Suggestion(BaseModel):
    type: str
    message: str


class DailyAnalysisResponse(BaseModel):
    findings: list[Finding]
    suggestions: list[Suggestion]
