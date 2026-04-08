from pydantic import BaseModel
from typing import Literal, Optional


TaskStatusLiteral = Literal["planned", "completed", "cancelled"]


class InputTask(BaseModel):
    id: str
    title: str
    status: TaskStatusLiteral
    assigned_date: str
    category: Optional[str] = None
    priority: Optional[int] = None
    defer_count: int = 0


class ContextTodayRequest(BaseModel):
    date: Optional[str] = None
    tasks: list[InputTask]
    include_news: bool = False
    max_focus: int = 3
    max_outstanding: int = 3
    max_news: int = 0


class FocusItem(BaseModel):
    task_id: str
    title: str
    reason: str
    score: float


class OutstandingItem(BaseModel):
    task_id: str
    title: str
    note: str


class NewsItem(BaseModel):
    title: str
    source: str
    url: str
    relevance_note: str


class ContextTodayResponse(BaseModel):
    date: str
    summary_line: str
    focus: list[FocusItem]
    outstanding: list[OutstandingItem]
    news: list[NewsItem]
    nudge: Optional[str] = None