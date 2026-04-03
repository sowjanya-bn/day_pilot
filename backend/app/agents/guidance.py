from __future__ import annotations

from app.agents.schemas import DailyContext, GuidanceItem, Insight, PatternFinding


class GuidanceEngine:
    def generate(
        self,
        context: DailyContext,
        findings: list[PatternFinding],
        insights: list[Insight],
    ) -> list[GuidanceItem]:
        guidance: list[GuidanceItem] = []
        finding_types = {finding.type for finding in findings}
        insight_types = {insight.type for insight in insights}

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

        if "carry_forward" in finding_types and (
            "overcommitment" in finding_types or "planning_load" in insight_types
        ):
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

        elif "overcommitment" in finding_types or "planning_load" in insight_types:
            guidance.append(
                GuidanceItem(
                    type="reduce_load",
                    priority="medium",
                    title="Reduce tomorrow's load",
                    message="Try planning fewer tasks tomorrow to match your current pace.",
                    action="reduce_plan_size",
                )
            )

        elif "backlog" in finding_types:
            guidance.append(
                GuidanceItem(
                    type="backlog_cleanup",
                    priority="medium",
                    title="Clear one older task",
                    message="Finish or intentionally drop one older open task before adding more work.",
                    action="clear_old_task",
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

        return guidance