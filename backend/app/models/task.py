from datetime import date, datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel

from sqlmodel import Field, SQLModel


class TaskStatus(str, Enum):
    PLANNED = "planned"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


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


class Task(SQLModel, table=False):
    """Example task model.

    Replace this with your real SQLModel entity import in your app.
    """

    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    status: TaskStatus = Field(default=TaskStatus.PLANNED)
    assigned_date: date
    completed_at: Optional[datetime] = None
    category: Optional[str] = None
    priority: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)