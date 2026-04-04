import type {
  DailyContext,
  Insight,
  PatternFinding,
} from "../../domain/types.ts";

export function synthesizeInsights(
  _context: DailyContext,
  findings: PatternFinding[]
): Insight[] {
  const insights: Insight[] = [];
  const findingMap = new Map(findings.map((finding) => [finding.type, finding]));

  if (findingMap.has("carry_forward") && findingMap.has("overcommitment")) {
    const carry = findingMap.get("carry_forward")!;
    const over = findingMap.get("overcommitment")!;

    insights.push({
      type: "planning_load",
      priority: "high",
      confidence: Math.min((carry.confidence + over.confidence) / 2, 0.95),
      message:
        "A few tasks seem to be dragging across days, which may mean the current plan is heavier than feels manageable right now.",
      supportingPatterns: ["carry_forward", "overcommitment"],
    });

    return insights;
  }

  if (findingMap.has("overcommitment")) {
    const over = findingMap.get("overcommitment")!;
    insights.push({
      type: "planning_load",
      priority: "medium",
      confidence: over.confidence,
      message:
        "It looks like your current plan might be a bit heavier than what feels manageable right now.",
      supportingPatterns: ["overcommitment"],
    });
  }

  if (findingMap.has("backlog")) {
    const backlog = findingMap.get("backlog")!;
    insights.push({
      type: "backlog_pressure",
      priority: "medium",
      confidence: backlog.confidence,
      message: "Open work seems to be building up and may start creating pressure across the week.",
      supportingPatterns: ["backlog"],
    });
  }

  if (findingMap.has("imbalance")) {
    const imbalance = findingMap.get("imbalance")!;
    insights.push({
      type: "attention_skew",
      priority: "medium",
      confidence: imbalance.confidence,
      message: "Most of your recent energy seems to be going into one area, so another part of life may be drifting.",
      supportingPatterns: ["imbalance"],
    });
  }

  if (!insights.length && findings.length) {
    const top = [...findings].sort((a, b) => b.confidence - a.confidence)[0];
    insights.push({
      type: "single_signal",
      priority: "medium",
      confidence: top.confidence,
      message: top.summary,
      supportingPatterns: [top.type],
    });
  }

  return insights;
}