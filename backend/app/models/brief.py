from datetime import date
from typing import Optional

from pydantic import BaseModel

from app.models.checkin import DailyCheckinResponse
from app.models.guidance import CarryForwardResponse
from app.models.planner import TomorrowPlanResponse
from app.models.stats import DailyStatsResponse
from app.models.task import DailyTaskListResponse

from pydantic import BaseModel
from typing import Optional


class AgentBriefResponse(BaseModel):
    insight: Optional[str] = None
    patterns: list[str] = []
    next_steps: list[str] = []


class DailyBriefResponse(BaseModel):
    date: date
    plan: Optional[TomorrowPlanResponse] = None
    yesterday_reflection: Optional[DailyCheckinResponse] = None
    guidance: CarryForwardResponse
    stats: DailyStatsResponse
    tasks: DailyTaskListResponse
    reflection: Optional[dict] = None