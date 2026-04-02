from __future__ import annotations

from app.agents.schemas import DailyContext, Insight, PatternFinding


class InsightSynthesizer:
    def synthesize(self, context: DailyContext, findings: list[PatternFinding]) -> list[Insight]:
        insights: list[Insight] = []
        finding_types = {finding.type: finding for finding in findings}

        if "carry_forward" in finding_types and "overcommitment" in finding_types:
            insights.append(
                Insight(
                    type="planning_load",
                    priority="high",
                    confidence=min(
                        (finding_types["carry_forward"].confidence + finding_types["overcommitment"].confidence) / 2,
                        0.95,
                    ),
                    message=(
                        "A few tasks are repeatedly carrying forward, which suggests friction or "
                        "more planned work than can realistically be completed right now."
                    ),
                    supporting_patterns=["carry_forward", "overcommitment"],
                )
            )

        elif "backlog" in finding_types:
            insights.append(
                Insight(
                    type="backlog_pressure",
                    priority="medium",
                    confidence=finding_types["backlog"].confidence,
                    message="Open work is accumulating and may start to create pressure across the week.",
                    supporting_patterns=["backlog"],
                )
            )

        if "imbalance" in finding_types:
            insights.append(
                Insight(
                    type="attention_skew",
                    priority="medium",
                    confidence=finding_types["imbalance"].confidence,
                    message="Your recent completions are concentrated in one area, so another category may be drifting.",
                    supporting_patterns=["imbalance"],
                )
            )

        if not insights and findings:
            top = sorted(findings, key=lambda item: item.confidence, reverse=True)[0]
            insights.append(
                Insight(
                    type="single_signal",
                    priority="medium",
                    confidence=top.confidence,
                    message=top.summary,
                    supporting_patterns=[top.type],
                )
            )

        return insights
