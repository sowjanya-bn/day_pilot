import type { DailyContext, PatternFinding } from "../../../domain/types.ts";

export function detectCarryForward(context: DailyContext): PatternFinding[] {
  const stale = context.staleTaskIds.length;

  if (stale === 0) return [];

  return [
    {
      type: "carry_forward",
      severity: stale >= 3 ? "high" : "medium",
      confidence: Math.min(0.6 + stale * 0.1, 0.95),
      summary: `Some tasks have been carrying forward across multiple days (${stale})`,
      evidence: {
        stale_count: stale,
      },
    },
  ];
}