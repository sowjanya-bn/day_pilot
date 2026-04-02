from __future__ import annotations

from agents.detectors.base import PatternDetector
from agents.schemas import DailyContext, PatternFinding


class ImbalanceDetector(PatternDetector):
    def __init__(self, dominance_ratio: float = 0.8) -> None:
        self.dominance_ratio = dominance_ratio

    def detect(self, context: DailyContext) -> list[PatternFinding]:
        completed = context.category_completed_counts
        total_completed = sum(completed.values())
        if total_completed == 0 or len(completed) <= 1:
            return []

        dominant_category, dominant_count = max(completed.items(), key=lambda item: item[1])
        ratio = dominant_count / total_completed
        if ratio < self.dominance_ratio:
            return []

        return [
            PatternFinding(
                type="imbalance",
                severity="medium",
                confidence=min(0.55 + ratio, 0.95),
                summary=f"Most recent completions are concentrated in '{dominant_category}'",
                evidence={
                    "dominant_category": dominant_category,
                    "dominant_count": dominant_count,
                    "total_completed": total_completed,
                    "ratio": ratio,
                },
            )
        ]
