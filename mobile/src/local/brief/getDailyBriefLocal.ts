import type {
  AgentReport,
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
import type { LLMEnhancer } from '../llm/enhancer.ts';
import { shiftDate } from '../../utils/date.ts';

function isCompleted(task: Task): boolean {
  return task.status === 'completed' || !!task.completedAt;
}

function buildStats(date: string, tasksIn7d: Task[]): DailyStats {
  return {
    date,
    planningStreak: 1,
    checkinStreak: 1,
    completedTasksLast7Days: tasksIn7d.filter(isCompleted).length,
    incompleteTasksLast7Days: tasksIn7d.filter((task) => !isCompleted(task)).length,
  };
}

function buildTaskList(date: string, todaysTasks: Task[]): DailyTaskList {
  return {
    date,
    outstanding: todaysTasks.filter((task) => !isCompleted(task)),
    completed: todaysTasks.filter(isCompleted),
  };
}

export async function buildGuidanceFromAgentAndTasks(
  date: string,
  todaysTasks: Task[],
  agentReport: AgentReport,
  enhancer?: LLMEnhancer,
): Promise<CarryForwardGuidance> {
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

  if (enhancer && primary) {
    enhancedMessage = await enhancer.enhanceGuidance({
      findings: agentReport.findings.map((f) => f.summary),
      insight: agentReport.insights[0]?.message,
      guidance: primary.message,
    });
  }

  return {
    date,
    focusMessage: enhancedMessage ?? baseMessage,
    suggestedLearningNextStep: 'Spend 20 minutes on your current learning goal.',
    suggestedJobNudge: 'Take one small job-search action today.',
    suggestedSocialNudge: 'Send one small message or start one light conversation.',
    carryForwardTasks,
  };
}

export async function getDailyBriefLocal(
  date: string,
  repository: DailyBriefRepository,
  enhancer?: LLMEnhancer,
): Promise<DailyBrief> {
  const windowStart = shiftDate(date, -6);

  const [todaysTasks, tasksIn7d, plan, yesterdayReflection] = await Promise.all([
    repository.getTasksForDate(date),
    repository.getTasksInRange(windowStart, date),
    repository.getPlanForDate(date),
    repository.getLatestCheckinBefore(date),
  ]);

  const stats = buildStats(date, tasksIn7d);
  const tasks = buildTaskList(date, todaysTasks);

  const context = collectDailyContext(date, tasksIn7d);
  const agentReport = generateAgentReport(context);

  const guidance = await buildGuidanceFromAgentAndTasks(
    date,
    todaysTasks,
    agentReport,
    enhancer,
  );

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
