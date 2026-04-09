from typing import Literal, Optional

from pydantic import BaseModel

from app.agents.schemas import GuidanceItem, Insight, PatternFinding


class CheckinSummary(BaseModel):
    mood: str
    blockers: list[str] = []


class TaskDaySummary(BaseModel):
    completed: int
    outstanding: int
    categories: dict[str, int] = {}


class DailyActivityRecord(BaseModel):
    date: str
    tasks: TaskDaySummary
    checkin: Optional[CheckinSummary] = None


class AnalysisRequest(BaseModel):
    end_date: str
    days: list[DailyActivityRecord]


class AnalysisResponse(BaseModel):
    period: str
    end_date: str
    window_days: int
    findings: list[PatternFinding]
    insights: list[Insight]
    guidance: list[GuidanceItem]
