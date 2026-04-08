from app.models.analysis import (
    DailyAnalysisRequest,
    DailyAnalysisResponse,
    Finding,
    Suggestion,
)


def analyze_daily_context(payload: DailyAnalysisRequest) -> DailyAnalysisResponse:
    findings: list[Finding] = []
    suggestions: list[Suggestion] = []

    planned = payload.stats.planned
    completed = payload.stats.completed
    cancelled = payload.stats.cancelled

    if planned >= 5 and completed <= max(1, planned // 2):
        findings.append(
            Finding(
                type="overcommitment",
                severity="medium",
                title="Load looks high",
                message="Today has more planned work than recent follow-through suggests.",
            )
        )
        suggestions.append(
            Suggestion(
                type="trim_scope",
                message="Try keeping tomorrow to a smaller core list and treating the rest as optional.",
            )
        )

    cancelled_tasks = [task for task in payload.tasks if task.status == "cancelled"]
    if cancelled_tasks or cancelled > 0:
        findings.append(
            Finding(
                type="cancellations",
                severity="low",
                title="Some work dropped off",
                message="Part of today's plan was cancelled instead of completed.",
            )
        )

    if not findings:
        findings.append(
            Finding(
                type="stable_day",
                severity="low",
                title="Day looks steady",
                message="There are no strong negative patterns in today's task activity.",
            )
        )
        suggestions.append(
            Suggestion(
                type="maintain",
                message="Keep the plan simple and keep the same rhythm tomorrow.",
            )
        )

    return DailyAnalysisResponse(findings=findings[:2], suggestions=suggestions[:2])
