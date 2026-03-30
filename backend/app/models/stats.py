from datetime import date

from pydantic import BaseModel


class DailyStatsResponse(BaseModel):
    date: date
    planning_streak: int
    checkin_streak: int
    completed_tasks_last_7_days: int
    incomplete_tasks_last_7_days: int