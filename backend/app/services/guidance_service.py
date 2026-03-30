from datetime import date, timedelta


def build_learning_next_step(previous_checkin: dict | None) -> str:
    if not previous_checkin:
        return "Spend 20 minutes on your current learning goal."

    learned = previous_checkin.get("learned")
    if learned:
        return f"Build a small next step from yesterday's learning: {learned}"

    return "Spend 20 minutes on your current learning goal."


def build_job_nudge(previous_checkin: dict | None) -> str:
    if not previous_checkin:
        return "Take one small job-search action today."

    mood = previous_checkin.get("mood", "steady")
    blockers = previous_checkin.get("blockers", [])

    if mood in ["low", "overwhelmed"] or blockers:
        return "Choose the smallest possible job-search action today."

    return "Refine one CV bullet or review one job posting."


def build_social_nudge(previous_checkin: dict | None) -> str:
    if not previous_checkin:
        return "Send one small message or check in with someone."

    mood = previous_checkin.get("mood", "steady")
    if mood in ["low", "overwhelmed"]:
        return "Keep social goals gentle today. Even one small message is enough."

    return "Send one small message or start one light conversation."


def build_focus_message(previous_checkin: dict | None, carry_forward_tasks: list[str]) -> str:
    if not previous_checkin:
        return "Keep the day simple and move one important thing forward."

    mood = previous_checkin.get("mood", "steady")
    blockers = previous_checkin.get("blockers", [])

    if mood in ["low", "overwhelmed"]:
        return "Keep today light. Focus on one small win."

    if blockers:
        return "Reduce friction today. Start with the easiest meaningful task."

    if carry_forward_tasks:
        return "Start with one carry-forward task to rebuild momentum."

    return "Keep the day simple and move one important thing forward."


def get_carry_forward(day: date, store) -> dict:
    previous_day = day - timedelta(days=1)
    previous_checkin = store.get_checkin_by_date(previous_day)

    carry_forward_tasks: list[str] = []
    if previous_checkin:
        carry_forward_tasks = previous_checkin.get("incomplete", [])

    return {
        "date": day,
        "carry_forward_tasks": carry_forward_tasks,
        "suggested_learning_next_step": build_learning_next_step(previous_checkin),
        "suggested_job_nudge": build_job_nudge(previous_checkin),
        "suggested_social_nudge": build_social_nudge(previous_checkin),
        "focus_message": build_focus_message(previous_checkin, carry_forward_tasks),
    }