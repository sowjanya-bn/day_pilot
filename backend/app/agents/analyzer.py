from __future__ import annotations

from datetime import date

from app.agents.detectors.backlog import BacklogDetector
from app.agents.detectors.carry_forward import CarryForwardDetector
from app.agents.detectors.imbalance import ImbalanceDetector
from app.agents.detectors.overcommitment import OvercommitmentDetector
from app.agents.guidance import GuidanceEngine
from app.agents.schemas import DailyContext, RollingStats
from app.agents.synthesizer import InsightSynthesizer
from app.models.analysis import AnalysisRequest, AnalysisResponse

PERIOD_CONFIG: dict[str, dict] = {
    "weekly": {
        "window_days": 7,
        "stale_days": 3,
        "open_threshold": 8,
        "min_planned": 4,
        "completion_threshold": 0.5,
    },
    "fortnightly": {
        "window_days": 14,
        "stale_days": 5,
        "open_threshold": 15,
        "min_planned": 8,
        "completion_threshold": 0.5,
    },
    "monthly": {
        "window_days": 30,
        "stale_days": 7,
        "open_threshold": 25,
        "min_planned": 15,
        "completion_threshold": 0.5,
    },
}


class StatelessAnalyzer:
    def __init__(self) -> None:
        self.synthesizer = InsightSynthesizer()
        self.guidance_engine = GuidanceEngine()

    def analyze(self, request: AnalysisRequest, period: str) -> AnalysisResponse:
        config = PERIOD_CONFIG[period]
        context = self._build_context(request, config)

        detectors = [
            CarryForwardDetector(stale_threshold=config["stale_days"]),
            BacklogDetector(open_threshold=config["open_threshold"]),
            ImbalanceDetector(),
            OvercommitmentDetector(
                min_planned=config["min_planned"],
                completion_ratio_threshold=config["completion_threshold"],
            ),
        ]

        findings = []
        for detector in detectors:
            findings.extend(detector.detect(context))

        insights = self.synthesizer.synthesize(context, findings)
        guidance = self.guidance_engine.generate(context, findings, insights)

        return AnalysisResponse(
            period=period,
            end_date=request.end_date,
            window_days=config["window_days"],
            findings=findings,
            insights=insights,
            guidance=guidance,
        )

    def _build_context(self, request: AnalysisRequest, config: dict) -> DailyContext:
        days = request.days
        if not days:
            end = date.fromisoformat(request.end_date)
            return DailyContext(date=end)

        total_completed = sum(d.tasks.completed for d in days)
        total_planned = sum(d.tasks.completed + d.tasks.outstanding for d in days)
        open_count = days[-1].tasks.outstanding
        completion_ratio = total_completed / total_planned if total_planned else 0.0

        # Stale estimate: minimum outstanding across the last stale_days days.
        # Any task open throughout that window is stale by definition.
        stale_days = config["stale_days"]
        recent = days[-stale_days:] if len(days) >= stale_days else days
        stale_count = min(d.tasks.outstanding for d in recent) if recent else 0

        # Aggregate category counts across the window as a proxy for imbalance.
        category_counts: dict[str, int] = {}
        for d in days:
            for cat, count in d.tasks.categories.items():
                category_counts[cat] = category_counts.get(cat, 0) + count

        end_date = date.fromisoformat(request.end_date)

        return DailyContext(
            date=end_date,
            today_task_ids=[],
            open_task_ids=list(range(open_count)),
            stale_task_ids=list(range(stale_count)),
            completed_today_ids=[],
            category_open_counts={},
            category_completed_counts=category_counts,
            rolling_7d=RollingStats(
                planned_count=total_planned,
                completed_count=total_completed,
                open_count=open_count,
                completion_ratio=completion_ratio,
            ),
        )
