import type { DailyContext, PatternFinding } from "../../../domain/types.ts";

const COMPLETION_RATIO_THRESHOLD = 0.6;
const MIN_PLANNED_COUNT = 3;

export function detectOvercommitment(context: DailyContext): PatternFinding[] {
  const stats = context.rolling7d;

  if (stats.plannedCount < MIN_PLANNED_COUNT) {
    return [];
  }

  if (stats.completionRatio >= COMPLETION_RATIO_THRESHOLD) {
    return [];
  }

  return [
    {
      type: "overcommitment",
      severity: stats.completionRatio < 0.5 ? "high" : "medium",
      confidence: Math.min(0.7 + (0.5 - stats.completionRatio), 0.95),
      summary: `You’ve been completing fewer tasks than planned over the past few days (≈ ${Math.round(
        stats.completionRatio * 100
      )}%)`,
      evidence: {
        plannedCount: stats.plannedCount,
        completedCount: stats.completedCount,
        completionRatio: stats.completionRatio,
        threshold: COMPLETION_RATIO_THRESHOLD,
      },
    },
  ];
}