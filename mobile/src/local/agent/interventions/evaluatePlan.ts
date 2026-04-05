import type { Task, DailyContext } from '../../domain/types.ts';
import type { PlanIntervention } from './types.ts';


function severityScore(s: 'low' | 'medium' | 'high') {
  if (s === 'high') return 3;
  if (s === 'medium') return 2;
  return 1;
}

export function evaluatePlan(
  todaysTasks: Task[],
  context: DailyContext
): PlanIntervention[] {
  const interventions: PlanIntervention[] = [];

  const taskCount = todaysTasks.length;
  const staleCount = context.state?.staleTaskIds?.length ?? 0;

  console.log(`Evaluating plan with ${taskCount} tasks, ${staleCount} stale tasks, categories: ${[...new Set(todaysTasks.map(t => t.category))].join(', ')}`);

  // --- 1. Overload detection ---
  if (taskCount >= 6) {
    interventions.push({
      type: 'plan_overload',
      severity: 'high',
      message:
        "This looks like a full plan. Want to narrow it down to a few tasks you can finish?",
    });
  } else if (taskCount >= 4) {
    interventions.push({
      type: 'plan_heavy',
      severity: 'medium',
      message:
        "This is a fairly packed day. Keeping it smaller might make it easier to complete.",
    });
  }

  // --- 2. Carry-forward pressure ---
  if (staleCount >= 3) {
    interventions.push({
      type: 'carry_forward_pressure',
      severity: 'high',
      message:
        "You already have a few pending tasks. Finishing one before adding more might help.",
    });
  } else if (staleCount >= 1) {
    interventions.push({
      type: 'carry_forward_present',
      severity: 'low',
      message:
        "You still have a task from earlier. Want to finish that before adding more?",
    });
  }

  // --- 3. Category imbalance ---
  const categoryCounts: Record<string, number> = {};

  for (const task of todaysTasks) {
    categoryCounts[task.category] =
      (categoryCounts[task.category] ?? 0) + 1;
  }

  const categories = Object.keys(categoryCounts);

  if (categories.length === 1 && taskCount >= 3) {
    interventions.push({
      type: 'category_imbalance',
      severity: 'low',
      message:
        "Everything today is focused on one area. Adding a bit of variety might help.",
    });
  }

  return interventions.sort(
      (a, b) => severityScore(b.severity) - severityScore(a.severity)
    );
}