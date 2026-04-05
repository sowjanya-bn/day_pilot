import type { DailyContext, Insight, PatternFinding } from '../domain/types.ts';

function getFinding(
  findings: PatternFinding[],
  type: string,
): PatternFinding | undefined {
  return findings.find((finding) => finding.type === type);
}

export function synthesizeInsights(
  _context: DailyContext,
  findings: PatternFinding[],
): Insight[] {
  if (findings.length === 0) {
    return [
      {
        type: 'status',
        message: 'No strong signals today. Things look stable.',
      },
    ];
  }

  const insights: Insight[] = [];

  const overcommitment = getFinding(findings, 'overcommitment');
  const carryForward = getFinding(findings, 'carry_forward');
  const backlogPressure = getFinding(findings, 'backlog_pressure');

  if (overcommitment && carryForward && backlogPressure) {
    insights.push({
      type: 'compounding_load_signal',
      message:
        'Work is not only clearing more slowly than planned, it also seems to be accumulating across days. That combination suggests the current load may be compounding rather than resetting naturally.',
    });
  } else if (overcommitment && carryForward) {
    insights.push({
      type: 'combined_load_signal',
      message:
        'Work seems to be accumulating faster than it is being cleared. Lower recent completion and repeated carry-forward together suggest the current load may be slightly ahead of your available capacity.',
    });
  } else if (backlogPressure && carryForward) {
    insights.push({
      type: 'backlog_signal',
      message:
        'Unfinished work appears to be sticking across days and building slightly, which suggests backlog may now need deliberate cleanup rather than passive rollover.',
    });
  } else if (overcommitment) {
    insights.push({
      type: 'throughput_signal',
      message:
        'Your recent completion rate appears lower than your planning rate, which may mean the week was scoped a little too tightly or interrupted more than expected.',
    });
  } else if (backlogPressure) {
    insights.push({
      type: 'backlog_pressure_signal',
      message:
        'Open work appears to be increasing relative to the previous week, which suggests unresolved tasks may be starting to accumulate.',
    });
  } else if (carryForward) {
    insights.push({
      type: 'carry_forward_signal',
      message:
        'A number of tasks are rolling forward from earlier days, which suggests unresolved work may be starting to cluster rather than clearing naturally.',
    });
  }

  const highest = findings[0];

  if (highest?.severity === 'high') {
    insights.push({
      type: 'priority_signal',
      message:
        'This looks strong enough to treat as a planning signal rather than a one-off blip.',
    });
  }

  return insights.slice(0, 2);
}
