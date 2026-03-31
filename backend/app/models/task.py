from datetime import date, datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel


class TaskStatus(str, Enum):
    outstanding = "outstanding"
    completed = "completed"


class DailyTaskCreate(BaseModel):
    date: date
    title: str
    category: str = "general"
    source: str = "manual"


class TaskStatusUpdate(BaseModel):
    status: TaskStatus


class TaskResponse(BaseModel):
    id: int
    title: str
    status: TaskStatus
    category: str
    source: str
    assigned_date: date
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None


class DailyTaskListResponse(BaseModel):
    date: date
    outstanding: list[TaskResponse]
    completed: list[TaskResponse]