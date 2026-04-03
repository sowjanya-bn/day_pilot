from __future__ import annotations

from app.agents.detectors.base import PatternDetector
from app.agents.schemas import DailyContext, PatternFinding


class BacklogDetector(PatternDetector):
    def __init__(self, open_threshold: int = 8) -> None:
        self.open_threshold = open_threshold

    def detect(self, context: DailyContext) -> list[PatternFinding]:
        open_count = context.rolling_7d.open_count
        if open_count < self.open_threshold:
            return []

        severity = "medium" if open_count < (self.open_threshold + 4) else "high"
        confidence = min(0.65 + (0.03 * open_count), 0.95)

        return [
            PatternFinding(
                type="backlog",
                severity=severity,
                confidence=confidence,
                summary=f"Open workload has grown to {open_count} tasks",
                evidence={
                    "open_count": open_count,
                    "threshold": self.open_threshold,
                },
            )
        ]
