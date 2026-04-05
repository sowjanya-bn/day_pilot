import type { DailyContext, PatternFinding } from '../../domain/types.ts';

const MIN_PLANNED_COUNT = 3;
const COMPLETION_RATIO_THRESHOLD = 0.7;

export function detectOvercommitment(context: DailyContext): PatternFinding[] {
  const current = context.windows.current7d.stats;
  const previous = context.windows.previous7d.stats;

  if (current.plannedCount < MIN_PLANNED_COUNT) {
    return [];
  }

  if (current.completionRatio >= COMPLETION_RATIO_THRESHOLD) {
    return [];
  }

  const worsening =
    previous.plannedCount >= MIN_PLANNED_COUNT &&
    current.completionRatio < previous.completionRatio;

  const severity = current.completionRatio < 0.5 ? 'high' : 'medium';

  const baseConfidence = 0.7 + (0.5 - current.completionRatio);
  const comparisonBonus = worsening ? 0.1 : 0;

  return [
    {
      type: 'overcommitment',
      severity,
      confidence: Math.min(baseConfidence + comparisonBonus, 0.95),
      summary: `You’ve been completing fewer tasks than planned over the past 7 days (≈ ${Math.round(
        current.completionRatio * 100,
      )}%)`,
      evidence: {
        current7d: {
          plannedCount: current.plannedCount,
          completedCount: current.completedCount,
          completionRatio: current.completionRatio,
        },
        previous7d: {
          plannedCount: previous.plannedCount,
          completedCount: previous.completedCount,
          completionRatio: previous.completionRatio,
        },
        threshold: COMPLETION_RATIO_THRESHOLD,
        worsening,
      },
      dedupeKey: 'overcommitment',
    },
  ];
}
