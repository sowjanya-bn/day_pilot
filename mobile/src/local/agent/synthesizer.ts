import type {
  AgentInsight,
  DailyContext,
  PatternFinding,
} from "../domain/types.ts";

function hasFinding(findings: PatternFinding[], type: string): boolean {
  return findings.some((finding) => finding.type === type);
}

function getFinding(
  findings: PatternFinding[],
  type: string
): PatternFinding | undefined {
  return findings.find((finding) => finding.type === type);
}

export function synthesizeInsights(
  _context: DailyContext,
  findings: PatternFinding[]
): AgentInsight[] {
  if (findings.length === 0) {
    return [
      {
        kind: "status",
        message: "No strong risk signals stand out right now.",
      },
    ];
  }

  const insights: AgentInsight[] = [];

  const overcommitment = getFinding(findings, "overcommitment");
  const carryForward = getFinding(findings, "carry_forward");

  if (overcommitment && carryForward) {
    insights.push({
      kind: "combined_load_signal",
      message:
        "Work seems to be accumulating faster than it is being cleared. Lower recent completion and repeated carry-forward together suggest the current load may be slightly ahead of your available capacity.",
    });
  } else if (overcommitment) {
    insights.push({
      kind: "throughput_signal",
      message:
        "Your recent completion rate appears lower than your planning rate, which may mean the week was scoped a little too tightly or interrupted more than expected.",
    });
  } else if (carryForward) {
    insights.push({
      kind: "carry_forward_signal",
      message:
        "A number of tasks are rolling forward from earlier days, which suggests unresolved work may be starting to cluster rather than clearing naturally.",
    });
  }

  const highest = findings[0];

  if (highest?.severity === "high") {
    insights.push({
      kind: "priority_signal",
      message:
        "This looks strong enough to treat as a real planning signal rather than a one-off blip.",
    });
  }

  return insights.slice(0, 2);
}