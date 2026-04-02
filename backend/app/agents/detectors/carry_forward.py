from __future__ import annotations

from agents.detectors.base import PatternDetector
from agents.schemas import DailyContext, PatternFinding


class CarryForwardDetector(PatternDetector):
    def __init__(self, stale_threshold: int = 3) -> None:
        self.stale_threshold = stale_threshold

    def detect(self, context: DailyContext) -> list[PatternFinding]:
        stale_count = len(context.stale_task_ids)
        if stale_count == 0:
            return []

        severity = "medium" if stale_count < 5 else "high"
        confidence = min(0.6 + (0.1 * stale_count), 0.95)

        return [
            PatternFinding(
                type="carry_forward",
                severity=severity,
                confidence=confidence,
                summary=(
                    f"{stale_count} tasks have remained open for at least "
                    f"{self.stale_threshold} days"
                ),
                evidence={
                    "stale_task_ids": context.stale_task_ids,
                    "stale_count": stale_count,
                    "stale_threshold_days": self.stale_threshold,
                },
            )
        ]
