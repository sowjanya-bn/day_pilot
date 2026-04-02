from __future__ import annotations

from agents.schemas import DailyContext, GuidanceItem, Insight, PatternFinding


class GuidanceEngine:
    def generate(
        self,
        context: DailyContext,
        findings: list[PatternFinding],
        insights: list[Insight],
    ) -> list[GuidanceItem]:
        guidance: list[GuidanceItem] = []
        finding_types = {finding.type for finding in findings}

        if "carry_forward" in finding_types:
            guidance.append(
                GuidanceItem(
                    type="task_breakdown",
                    priority="high",
                    title="Shrink one stale task",
                    message="Pick one older open task and rewrite it as a smaller first step for tomorrow.",
                    action="split_oldest_task",
                )
            )

        if "overcommitment" in finding_types or "backlog" in finding_types:
            guidance.append(
                GuidanceItem(
                    type="planning_adjustment",
                    priority="high",
                    title="Reduce tomorrow's load",
                    message="Cap tomorrow's plan at 3 tasks and finish one older task before adding more work.",
                    action="cap_tomorrow_tasks",
                    parameters={"max_tasks": 3},
                )
            )

        if "imbalance" in finding_types:
            guidance.append(
                GuidanceItem(
                    type="rebalance_categories",
                    priority="medium",
                    title="Add one neglected area",
                    message="Include one task from a less-active category in tomorrow's plan to keep the week balanced.",
                    action="add_category_slot",
                )
            )

        if not guidance:
            guidance.append(
                GuidanceItem(
                    type="maintain_momentum",
                    priority="low",
                    title="Keep the plan steady",
                    message="Your current task flow looks manageable. Keep tomorrow's plan small and focused.",
                )
            )

        return guidance
