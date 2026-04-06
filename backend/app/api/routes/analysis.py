from fastapi import APIRouter
from pydantic import BaseModel
from typing import Dict, List, Optional


router = APIRouter(prefix="/analysis", tags=["analysis"])


class CheckinPayload(BaseModel):
    mood: str
    blockers: List[str]


class TaskSummaryPayload(BaseModel):
    completed: int
    outstanding: int
    categories: Dict[str, int]


class ActivityDayPayload(BaseModel):
    date: str
    tasks: TaskSummaryPayload
    checkin: Optional[CheckinPayload] = None


class ActivityWindowPayload(BaseModel):
    windowDays: int
    endDate: str
    days: List[ActivityDayPayload]


@router.post("/activity")
def analyze_activity(payload: ActivityWindowPayload):
    days = payload.days

    total_completed = sum(day.tasks.completed for day in days)
    total_outstanding = sum(day.tasks.outstanding for day in days)
    avg_completed = total_completed / len(days) if days else 0
    avg_outstanding = total_outstanding / len(days) if days else 0

    high_load_days = [
        day.date
        for day in days
        if (day.tasks.completed + day.tasks.outstanding) >= 5
    ]

    blocker_count = sum(len(day.checkin.blockers) for day in days if day.checkin)

    patterns = []
    insights = []
    recommendations = []

    if avg_outstanding > avg_completed:
        patterns.append("Outstanding work has been staying higher than completed work across this period.")
        insights.append("Your load may be accumulating faster than it clears.")
        recommendations.append("Try reducing daily planning volume and clearing one older task before adding more.")

    if high_load_days:
        patterns.append(f"You had {len(high_load_days)} heavier day(s) in the selected window.")
        insights.append("Completion may improve when the daily task count stays smaller.")
        recommendations.append("Experiment with capping the plan to 3 meaningful tasks on busy days.")

    if blocker_count > 0:
        patterns.append("Blockers appeared in recent check-ins.")
        insights.append("Some slowdown may be coming from friction rather than motivation.")
        recommendations.append("Review blockers first before expanding the next plan.")

    if not patterns:
        patterns.append("Your recent activity looks fairly stable.")
        insights.append("There are no strong negative patterns in the selected window.")
        recommendations.append("Keep the plan simple and maintain the current rhythm.")

    return {
        "windowDays": payload.windowDays,
        "endDate": payload.endDate,
        "patterns": patterns[:2],
        "insights": insights[:2],
        "recommendations": recommendations[:2],
        "summary": {
            "avgCompleted": round(avg_completed, 2),
            "avgOutstanding": round(avg_outstanding, 2),
            "blockerCount": blocker_count,
        },
    }