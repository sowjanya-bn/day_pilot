from datetime import date
from typing import Optional

from pydantic import BaseModel


class CarryForwardResponse(BaseModel):
    date: date
    carry_forward_tasks: list[str]
    suggested_learning_next_step: Optional[str] = None
    suggested_job_nudge: Optional[str] = None
    suggested_social_nudge: Optional[str] = None
    focus_message: str