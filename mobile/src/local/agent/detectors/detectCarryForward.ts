import type { DailyContext, PatternFinding } from "../../domain/types.ts";

export function detectCarryForward(context: DailyContext): PatternFinding[] {
  const staleTaskIds = context.state.staleTaskIds;
  const stale = staleTaskIds.length;

  if (stale === 0) {
    return [];
  }

  return [
    {
      type: "carry_forward",
      severity: stale >= 5 ? "high" : stale >= 3 ? "medium" : "low",
      confidence: Math.min(0.7 + stale * 0.05, 0.95),
      summary:
        stale === 1
          ? "One task has been carried forward from an earlier day."
          : `${stale} tasks have been carried forward from earlier days.`,
      evidence: {
        staleCount: stale,
        staleTaskIds,
      },
      dedupeKey: "carry_forward",
    },
  ];
}