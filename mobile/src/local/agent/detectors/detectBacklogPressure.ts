import type { DailyContext, PatternFinding } from "../../domain/types.ts";

const MIN_PLANNED_COUNT = 3;

export function detectBacklogPressure(
  context: DailyContext
): PatternFinding[] {
  const current = context.windows.current7d.stats;
  const previous = context.windows.previous7d.stats;

  if (current.plannedCount < MIN_PLANNED_COUNT) {
    return [];
  }

  const openDelta = current.openCount - previous.openCount;
  const completionDelta = current.completedCount - previous.completedCount;

  const hasPressure =
    current.openCount >= 2 &&
    (openDelta >= 2 || (openDelta >= 1 && completionDelta <= 0));

  if (!hasPressure) {
    return [];
  }

  const severity =
    openDelta >= 3 || current.openCount >= 4
      ? "high"
      : openDelta >= 2
        ? "medium"
        : "low";

  const confidence = Math.min(
    0.68 +
      openDelta * 0.08 +
      (completionDelta <= 0 ? 0.08 : 0),
    0.95
  );

  return [
    {
      type: "backlog_pressure",
      severity,
      confidence,
      summary:
        openDelta > 0
          ? `Open work has increased compared with the previous 7 days, which suggests backlog may be building.`
          : `Open work remains elevated, which suggests unresolved load is starting to stick.`,
      evidence: {
        current7d: {
          plannedCount: current.plannedCount,
          completedCount: current.completedCount,
          openCount: current.openCount,
          completionRatio: current.completionRatio,
        },
        previous7d: {
          plannedCount: previous.plannedCount,
          completedCount: previous.completedCount,
          openCount: previous.openCount,
          completionRatio: previous.completionRatio,
        },
        openDelta,
        completionDelta,
      },
      dedupeKey: "backlog_pressure",
    },
  ];
}