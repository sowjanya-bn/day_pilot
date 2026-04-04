import type {
  DailyContext,
  GuidanceItem,
  Insight,
  PatternFinding,
} from "../../domain/types.ts";

export function generateGuidance(
  _context: DailyContext,
  findings: PatternFinding[],
  insights: Insight[]
): GuidanceItem[] {
  const guidance: GuidanceItem[] = [];
  const findingTypes = new Set(findings.map((finding) => finding.type));
  const insightTypes = new Set(insights.map((insight) => insight.type));

  if (findingTypes.has("carry_forward")) {
    guidance.push({
      type: "task_breakdown",
      priority: "high",
      title: "Shrink one stale task",
      message: "Pick one older open task and rewrite it as a smaller first step for tomorrow.",
      action: "split_oldest_task",
    });
  }

  if (
    findingTypes.has("carry_forward") &&
    (findingTypes.has("overcommitment") || insightTypes.has("planning_load"))
  ) {
    guidance.push({
      type: "planning_adjustment",
      priority: "high",
      title: "Reduce tomorrow's load",
      message: "Cap tomorrow’s plan at 3 tasks and finish one older task before adding more work.",
      action: "cap_tomorrow_tasks",
      parameters: { maxTasks: 3 },
    });
  } else if (findingTypes.has("overcommitment") || insightTypes.has("planning_load")) {
    guidance.push({
      type: "reduce_load",
      priority: "medium",
      title: "Reduce tomorrow's load",
      message: "Try limiting tomorrow’s plan to 2–3 tasks so it feels easier to complete.",
      action: "reduce_plan_size",
    });
  } else if (findingTypes.has("backlog")) {
    guidance.push({
      type: "backlog_cleanup",
      priority: "medium",
      title: "Clear one older task",
      message: "Finish or intentionally drop one older open task before adding more work.",
      action: "clear_old_task",
    });
  }

  if (findingTypes.has("imbalance")) {
    guidance.push({
      type: "rebalance_categories",
      priority: "medium",
      title: "Add one neglected area",
      message: "Include one task from a less-active category in tomorrow’s plan to keep the week balanced.",
      action: "add_category_slot",
    });
  }

  return guidance;
}