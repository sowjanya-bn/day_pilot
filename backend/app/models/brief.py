from datetime import date
from typing import Optional

from pydantic import BaseModel

from app.models.planner import TomorrowPlanResponse
from app.models.checkin import DailyCheckinResponse
from app.models.guidance import CarryForwardResponse


class DailyBriefResponse(BaseModel):
    date: date
    plan: Optional[TomorrowPlanResponse] = None
    yesterday_reflection: Optional[DailyCheckinResponse] = None
    guidance: CarryForwardResponse