from __future__ import annotations

from datetime import date
from typing import Any

from pydantic import BaseModel, Field


class RollingStats(BaseModel):
    planned_count: int = 0
    completed_count: int = 0
    open_count: int = 0
    completion_ratio: float = 0.0


class DailyContext(BaseModel):
    date: date
    today_task_ids: list[int] = Field(default_factory=list)
    open_task_ids: list[int] = Field(default_factory=list)
    stale_task_ids: list[int] = Field(default_factory=list)
    completed_today_ids: list[int] = Field(default_factory=list)
    category_open_counts: dict[str, int] = Field(default_factory=dict)
    category_completed_counts: dict[str, int] = Field(default_factory=dict)
    rolling_7d: RollingStats = Field(default_factory=RollingStats)


class PatternFinding(BaseModel):
    type: str
    severity: str
    confidence: float
    summary: str
    evidence: dict[str, Any] = Field(default_factory=dict)


class Insight(BaseModel):
    type: str
    priority: str
    confidence: float
    message: str
    supporting_patterns: list[str] = Field(default_factory=list)


class GuidanceItem(BaseModel):
    type: str
    priority: str
    title: str
    message: str
    action: str | None = None
    parameters: dict[str, Any] = Field(default_factory=dict)


class AgentReport(BaseModel):
    date: date
    findings: list[PatternFinding] = Field(default_factory=list)
    insights: list[Insight] = Field(default_factory=list)
    guidance: list[GuidanceItem] = Field(default_factory=list)
