from typing import Optional
from pydantic import BaseModel

from app.models.context import InputTask


class BriefingRequest(BaseModel):
    date: Optional[str] = None
    tasks: list[InputTask]
    max_learn: int = 5
    max_pulse: int = 5
    max_tools: int = 3


class SnippetItem(BaseModel):
    title: str
    url: str
    source: str
    relevance_note: str


class DailySnippet(BaseModel):
    date: str
    topics: list[str]
    learn: list[SnippetItem]
    pulse: list[SnippetItem]
    tools: list[SnippetItem]
