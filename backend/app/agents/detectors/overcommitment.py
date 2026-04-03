from __future__ import annotations

from app.agents.detectors.base import PatternDetector
from app.agents.schemas import DailyContext, PatternFinding


class OvercommitmentDetector(PatternDetector):
    def __init__(self, completion_ratio_threshold: float = 0.5, min_planned: int = 4) -> None:
        self.completion_ratio_threshold = completion_ratio_threshold
        self.min_planned = min_planned

    def detect(self, context: DailyContext) -> list[PatternFinding]:
        stats = context.rolling_7d
        if stats.planned_count < self.min_planned:
            return []
        if stats.completion_ratio >= self.completion_ratio_threshold:
            return []

        return [
            PatternFinding(
                type="overcommitment",
                severity="high" if stats.completion_ratio < 0.5 else "medium",
                confidence=min(0.7 + (0.5 - stats.completion_ratio), 0.95),
                summary=(
                    f"You’ve been completing fewer tasks than you planned over the past few days (≈ {stats.completion_ratio:.0%})"
                ),
                evidence={
                    "planned_count": stats.planned_count,
                    "completed_count": stats.completed_count,
                    "completion_ratio": stats.completion_ratio,
                },
            )
        ]
