from datetime import date, timedelta

from fastapi import HTTPException, status
from sqlmodel import Session

from app.models.brief import DailyBriefResponse
from app.services import checkin_service, planner_service
from app.services.guidance_service import get_carry_forward
from app.services.stats_service import get_daily_stats
from app.services.task_service import list_tasks_for_day
from app.agents.service import AgentService

def map_agent_to_brief(agent_report):
    if not agent_report:
        return None

    insight = None
    if agent_report.insights:
        insight = agent_report.insights[0].message

    guidance = [g.message for g in agent_report.guidance[:2]]
    patterns = [f.summary for f in agent_report.findings[:2]]

    if not insight and not guidance and not patterns:
        return None

    if insight and insight in patterns:
        insight = None

    reflection = {
        "insight": insight,
        "guidance": guidance,
        "patterns": patterns,
    }

    print("Mapped Reflection:", reflection)

    if not reflection["insight"] and not reflection["patterns"] and not reflection["guidance"]:
        reflection = None

    return reflection

def get_daily_brief(session: Session, day: date) -> DailyBriefResponse:
    try:
        plan = planner_service.get_plan(session, day)
    except HTTPException as exc:
        if exc.status_code == status.HTTP_404_NOT_FOUND:
            plan = None
        else:
            raise

    try:
        yesterday = checkin_service.get_checkin(session, day - timedelta(days=1))
    except HTTPException as exc:
        if exc.status_code == status.HTTP_404_NOT_FOUND:
            yesterday = None
        else:
            raise

    guidance = get_carry_forward(session, day)
    stats = get_daily_stats(session, day)
    tasks = list_tasks_for_day(session, day)
    agent_service = AgentService()
    agent_report = agent_service.generate_daily_report(session, day)
    reflection = map_agent_to_brief(agent_report)
    print("Agent Report:", agent_report)
    print("Reflection:", reflection)

    print("FINDINGS:", [(f.type, f.summary, f.severity, f.confidence) for f in agent_report.findings])
    print("INSIGHTS:", [(i.type, i.message, i.confidence) for i in agent_report.insights])
    print("GUIDANCE:", [(g.type, g.message) for g in agent_report.guidance])

    return DailyBriefResponse(
        date=day,
        plan=plan,
        yesterday_reflection=yesterday,
        guidance=guidance,
        stats=stats,
        tasks=tasks,
        reflection=reflection,
    )