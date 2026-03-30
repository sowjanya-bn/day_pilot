import json
from datetime import date, timedelta

from sqlmodel import Session

from app.models.guidance import CarryForwardResponse
from app.services.checkin_service import get_previous_checkin_entity


def build_focus_message(
    mood: str,
    blockers: list[str],
    carry_forward_tasks: list[str],
    completed_tasks: list[str],
) -> str:
    if mood in ["low", "overwhelmed"]:
        if carry_forward_tasks:
            return "Keep today light. Pick just one carry-forward task and let that be enough."
        return "Keep today light. Aim for one small, doable win."

    if blockers:
        return "Reduce friction today. Start with the easiest meaningful task."

    if len(carry_forward_tasks) >= 3:
        return "You have a few carry-forward tasks. Choose one important task first instead of trying to do everything."

    if carry_forward_tasks:
        return "Start with one carry-forward task to rebuild momentum."

    if completed_tasks:
        return "You made progress yesterday. Build on that momentum with one clear priority."

    return "Keep the day simple and move one important thing forward."


def build_learning_next_step(previous, mood: str) -> str:
    if previous is None:
        return "Spend 20 minutes on your current learning goal."

    learned = (previous.learned or "").strip()

    if mood in ["low", "overwhelmed"]:
        if learned:
            return f"Keep learning gentle today. Revisit this briefly: {learned}"
        return "Keep learning gentle today. Spend 10 to 15 minutes reviewing what you already studied."

    if learned:
        return f"Build on yesterday's learning: {learned}"

    return "Spend 20 minutes on your current learning goal."


def build_job_nudge(mood: str, blockers: list[str], completed_tasks: list[str]) -> str:
    if mood in ["low", "overwhelmed"]:
        return "Keep job-search effort light today. Review one posting or tweak one CV bullet."

    if blockers:
        return "Choose the smallest possible job-search step today."

    if completed_tasks:
        return "You have some momentum. Apply to one role or improve one CV section."

    return "Take one small job-search action today."


def build_social_nudge(mood: str, blockers: list[str]) -> str:
    if mood in ["low", "overwhelmed"]:
        return "Keep social goals gentle today. Even one short message is enough."

    if blockers:
        return "Keep connection light today. Reply to one message or check in briefly with someone."

    return "Send one small message or start one light conversation."


def get_carry_forward(session: Session, day: date) -> CarryForwardResponse:
    previous_day = day - timedelta(days=1)
    previous = get_previous_checkin_entity(session, previous_day)

    carry_forward_tasks: list[str] = []
    completed_tasks: list[str] = []
    mood = "steady"
    blockers: list[str] = []

    if previous is not None:
        carry_forward_tasks = json.loads(previous.incomplete_json)
        completed_tasks = json.loads(previous.completed_json)
        mood = previous.mood
        blockers = json.loads(previous.blockers_json)

    focus_message = build_focus_message(
        mood=mood,
        blockers=blockers,
        carry_forward_tasks=carry_forward_tasks,
        completed_tasks=completed_tasks,
    )

    learning_next_step = build_learning_next_step(previous, mood)
    job_nudge = build_job_nudge(mood, blockers, completed_tasks)
    social_nudge = build_social_nudge(mood, blockers)

    return CarryForwardResponse(
        date=day,
        carry_forward_tasks=carry_forward_tasks,
        suggested_learning_next_step=learning_next_step,
        suggested_job_nudge=job_nudge,
        suggested_social_nudge=social_nudge,
        focus_message=focus_message,
    )