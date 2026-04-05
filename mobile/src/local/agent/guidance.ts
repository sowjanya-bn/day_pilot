import type {
  DailyContext,
  GuidanceItem,
  Insight,
  PatternFinding,
} from '../../domain/types.ts';

import type { AgentReport, Task } from '../../domain/types.ts';
import type { LLMEnhancer } from '../llm/enhancer.ts';

export async function buildGuidanceFromAgentAndTasks(
  date: string,
  todaysTasks: Task[],
  agentReport: AgentReport,
  enhancer?: LLMEnhancer,
) {
  const guidanceItems = agentReport.guidance ?? [];
  const primary = guidanceItems[0];

  console.log('Agent Report Findings:', agentReport.findings);

  const carryForwardTasks = todaysTasks
    .filter((task) => task.status === 'outstanding')
    .map((task) => task.title);

  const fallbackMessage =
    carryForwardTasks.length > 0
      ? 'Focus on finishing one existing task before adding new work.'
      : 'Keep the day simple and move one important thing forward.';

  const baseMessage = primary?.message ?? fallbackMessage;

  let enhancedMessage: string | null = null;

  console.log('Enhanced Guidance Message:', enhancedMessage);

  if (enhancer && primary) {
    console.log('Enhancing guidance message with LLM Enhancer...');
    enhancedMessage = await enhancer.enhanceGuidance({
      findings: agentReport.findings.map((f) => f.summary),
      insight: agentReport.insights[0]?.message,
      guidance: primary.message,
    });
    console.log('Enhanced Guidance Message:', enhancedMessage);
  }

  return {
    date,
    focusMessage: enhancedMessage ?? baseMessage,
    suggestedLearningNextStep:
      'Spend 20 minutes on your current learning goal.',
    suggestedJobNudge: 'Take one small job-search action today.',
    suggestedSocialNudge:
      'Send one small message or start one light conversation.',
    carryForwardTasks,
  };
}

export function generateGuidance(
  _context: DailyContext,
  findings: PatternFinding[],
  insights: Insight[],
): GuidanceItem[] {
  const findingTypes = new Set(findings.map((finding) => finding.type));
  const insightTypes = new Set(
    insights.map((insight) => insight.type ?? insight.kind),
  );

  const guidance: GuidanceItem[] = [];

  const hasCarryForward = findingTypes.has('carry_forward');
  const hasOvercommitment = findingTypes.has('overcommitment');
  const hasBacklogPressure =
    findingTypes.has('backlog_pressure') || findingTypes.has('backlog');
  const hasImbalance = findingTypes.has('imbalance');

  const hasPlanningLoadInsight =
    insightTypes.has('planning_load') ||
    insightTypes.has('combined_load_signal') ||
    insightTypes.has('compounding_load_signal') ||
    insightTypes.has('backlog_signal');

  if (hasBacklogPressure) {
    guidance.push({
      type: 'backlog_cleanup',
      priority: 'high',
      title: 'Clear backlog before adding more',
      message:
        'Reduce incoming work for a day and clear one or two older open tasks before expanding the plan again.',
      action: 'clear_old_task',
    });

    if (hasCarryForward) {
      guidance.push({
        type: 'task_breakdown',
        priority: 'medium',
        title: 'Shrink one stale task',
        message:
          'Pick one carried-forward task and rewrite it as a smaller first step so it becomes easier to finish.',
        action: 'split_oldest_task',
      });
    }

    return guidance.slice(0, 2);
  }

  if (hasCarryForward && (hasOvercommitment || hasPlanningLoadInsight)) {
    guidance.push({
      type: 'planning_adjustment',
      priority: 'high',
      title: "Reduce tomorrow's load",
      message:
        'Cap tomorrow’s plan at 3 tasks and finish one older task before adding anything new.',
      action: 'cap_tomorrow_tasks',
      parameters: { maxTasks: 3 },
    });

    return guidance;
  }

  if (hasCarryForward) {
    guidance.push({
      type: 'task_breakdown',
      priority: 'high',
      title: 'Shrink one stale task',
      message:
        'Pick one older open task and rewrite it as a smaller first step for tomorrow.',
      action: 'split_oldest_task',
    });

    return guidance;
  }

  if (hasOvercommitment || hasPlanningLoadInsight) {
    guidance.push({
      type: 'reduce_load',
      priority: 'medium',
      title: "Reduce tomorrow's load",
      message:
        'Cap tomorrow’s plan at 2 to 3 meaningful tasks so completion feels more realistic.',
      action: 'reduce_plan_size',
      parameters: { maxTasks: 3 },
    });

    return guidance;
  }

  if (hasImbalance) {
    guidance.push({
      type: 'rebalance_categories',
      priority: 'medium',
      title: 'Add one neglected area',
      message:
        'Include one task from a less-active category in tomorrow’s plan to keep the week balanced.',
      action: 'add_category_slot',
    });

    return guidance;
  }

  guidance.push({
    type: 'steady_progress',
    priority: 'low',
    title: 'Keep the day simple',
    message:
      'Keep the day simple and move one important thing forward before adding extra goals.',
    action: 'maintain_focus',
  });

  return guidance;
}
