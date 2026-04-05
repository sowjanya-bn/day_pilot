import type {
  CarryForwardGuidance,
  DailyBrief,
  DailyCheckin,
  DailyStats,
  DailyTaskList,
  Task,
  TomorrowPlan,
} from '../../domain/types.ts';
import { generateAgentReport } from '../agent/index.ts';
import { collectDailyContext } from '../agent/collector.ts';
import { mapAgentToBrief } from './mapAgentToBrief.ts';

import type { DailyBriefRepository } from '../storage/repository.ts';

import { ollamaEnhancer } from '../llm/ollamaEnhancer.ts';

function shiftDate(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function isCompleted(task: Task): boolean {
  return task.status === 'completed' || !!task.completedAt;
}

function buildStats(date: string, tasksIn7d: Task[]): DailyStats {
  const completedTasksLast7Days = tasksIn7d.filter(isCompleted).length;
  const incompleteTasksLast7Days = tasksIn7d.filter(
    (task) => !isCompleted(task),
  ).length;

  return {
    date,
    planningStreak: 1,
    checkinStreak: 1,
    completedTasksLast7Days,
    incompleteTasksLast7Days,
  };
}

function buildTaskList(date: string, todaysTasks: Task[]): DailyTaskList {
  return {
    date,
    outstanding: todaysTasks.filter((task) => !isCompleted(task)),
    completed: todaysTasks.filter(isCompleted),
  };
}

function buildCarryForwardGuidance(
  date: string,
  todaysTasks: Task[],
): CarryForwardGuidance {
  const carryForwardTasks = todaysTasks
    .filter((task) => !isCompleted(task))
    .map((task) => task.title);

  return {
    date,
    carryForwardTasks,
    suggestedLearningNextStep:
      'Spend 20 minutes on your current learning goal.',
    suggestedJobNudge: 'Take one small job-search action today.',
    suggestedSocialNudge:
      'Send one small message or start one light conversation.',
    focusMessage: 'Keep the day simple and move one important thing forward.',
  };
}

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

  const carryForwardTasks = todaysTasks
    .filter((task) => task.status === 'outstanding')
    .map((task) => task.title);

  const fallbackMessage =
    carryForwardTasks.length > 0
      ? 'Focus on finishing one existing task before adding new work.'
      : 'Keep the day simple and move one important thing forward.';

  const baseMessage = primary?.message ?? fallbackMessage;

  let enhancedMessage: string | null = null;

//   console.log('Agent Report Findings:', agentReport.findings);

  if (enhancer && primary) {
    console.log('Enhancing guidance message with LLM Enhancer...');
    enhancedMessage = await enhancer.enhanceGuidance({
      findings: agentReport.findings.map((f) => f.summary),
      insight: agentReport.insights[0]?.message,
      guidance: primary.message,
    });
  }

//   console.log('Enhanced Guidance Message:', enhancedMessage);

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

export async function getDailyBriefLocal(
  date: string,
  repository: DailyBriefRepository,
): Promise<DailyBrief> {
  const windowStart = shiftDate(date, -6);

  const [todaysTasks, tasksIn7d, plan, yesterdayReflection] = await Promise.all(
    [
      repository.getTasksForDate(date),
      repository.getTasksInRange(windowStart, date),
      repository.getPlanForDate(date),
      repository.getLatestCheckinBefore(date),
    ],
  );

  const stats = buildStats(date, tasksIn7d);
  const tasks = buildTaskList(date, todaysTasks);

  const context = collectDailyContext(date, tasksIn7d);
  const agentReport = generateAgentReport(context);

  //   const guidance = buildGuidanceFromAgentAndTasks(
  //     date,
  //     todaysTasks,
  //     agentReport
  //   );

  const ENABLE_LLM = true;

  const guidance = await buildGuidanceFromAgentAndTasks(
    date,
    todaysTasks,
    agentReport,
    ENABLE_LLM ? ollamaEnhancer : undefined,
  );

//   console.log('Generated Guidance:', guidance);
  const reflection = mapAgentToBrief(agentReport);

  return {
    date,
    plan,
    yesterdayReflection,
    guidance,
    stats,
    tasks,
    reflection,
    debug: {
      findings: agentReport.findings,
      insights: agentReport.insights,
      guidance: agentReport.guidance,
    },
  };
}
