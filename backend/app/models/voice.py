from datetime import date
from typing import Optional

from pydantic import BaseModel


class VoiceCheckinDraftRequest(BaseModel):
    date: date
    transcript: str


class VoiceCheckinDraftResponse(BaseModel):
    date: date
    completed: list[str]
    incomplete: list[str]
    blockers: list[str]
    carry_forward: list[str]
    learned: Optional[str] = None
    small_win: Optional[str] = None
    mood: str = "steady"
    notes: Optional[str] = None
    transcript: str