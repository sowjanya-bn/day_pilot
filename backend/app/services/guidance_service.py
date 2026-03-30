import json
from datetime import date, timedelta

from sqlmodel import Session

from app.models.guidance import CarryForwardResponse
from app.services.checkin_service import get_previous_checkin_entity


import json
from datetime import date, timedelta

from fastapi import HTTPException
from sqlmodel import Session

from app.models.guidance import CarryForwardResponse
from app.services.checkin_service import get_checkin


def get_carry_forward(session: Session, day: date) -> CarryForwardResponse:
    previous_day = day - timedelta(days=1)
    try:
        previous = get_checkin(session, previous_day)
    except HTTPException:
        previous = None

    carry_forward_tasks: list[str] = []
    mood = "steady"
    blockers: list[str] = []

    if previous is not None:
        carry_forward_tasks = previous.incomplete
        mood = previous.mood
        blockers = previous.blockers

    focus_message = "Keep the day simple and move one important thing forward."
    if mood in ["low", "overwhelmed"]:
        focus_message = "Keep today light. Focus on one small win."
    elif blockers:
        focus_message = "Reduce friction today. Start with the easiest meaningful task."
    elif carry_forward_tasks:
        focus_message = "Start with one carry-forward task to rebuild momentum."

    return CarryForwardResponse(
        date=day,
        carry_forward_tasks=carry_forward_tasks,
        suggested_learning_next_step="Spend 20 minutes on your current learning goal.",
        suggested_job_nudge="Take one small job-search action today.",
        suggested_social_nudge="Send one small message or check in with someone.",
        focus_message=focus_message,
    )