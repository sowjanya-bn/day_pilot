from datetime import date, timedelta
from fastapi import APIRouter

from app.models.guidance import CarryForwardResponse
from app.services.store import store

router = APIRouter(tags=["guidance"])


@router.get("/carry-forward/{day}", response_model=CarryForwardResponse)
def get_carry_forward(day: date):
    previous_day = day - timedelta(days=1)
    previous = store.get_checkin_by_date(previous_day)

    carry_forward_tasks = []
    focus_message = "Keep the day simple and move one thing forward."

    if previous:
        carry_forward_tasks = previous.get("incomplete", [])

        mood = previous.get("mood", "steady")

        if mood in ["low", "overwhelmed"]:
            focus_message = "Keep today light. Focus on one small win."
        elif carry_forward_tasks:
            focus_message = "Start with one carry-forward task."

    return {
        "date": day,
        "carry_forward_tasks": carry_forward_tasks,
        "suggested_learning_next_step": "Spend 20 minutes on your learning goal",
        "suggested_job_nudge": "Take one small job action",
        "suggested_social_nudge": "Send one message",
        "focus_message": focus_message,
    }