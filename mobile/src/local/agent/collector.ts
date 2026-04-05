import type { DailyContext, Task, WindowStats } from '../../domain/types.ts';

function isoToDate(value: string): Date {
  return new Date(`${value}T00:00:00`);
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function shiftDate(isoDate: string, days: number): string {
  const d = isoToDate(isoDate);
  d.setDate(d.getDate() + days);
  return formatDate(d);
}

function isCompleted(task: Task): boolean {
  return task.status === 'completed' || !!task.completedAt;
}

function wasCompletedOnDate(task: Task, isoDate: string): boolean {
  if (!task.completedAt) return false;
  return task.completedAt.slice(0, 10) === isoDate;
}

function getTasksAssignedInWindow(
  tasks: Task[],
  startDate: string,
  endDate: string,
): Task[] {
  return tasks.filter(
    (task) => task.assignedDate >= startDate && task.assignedDate <= endDate,
  );
}

function buildWindowStats(tasksInWindow: Task[]): WindowStats {
  const plannedCount = tasksInWindow.length;
  const completedCount = tasksInWindow.filter(isCompleted).length;
  const openCount = tasksInWindow.filter((task) => !isCompleted(task)).length;
  const completionRatio = plannedCount > 0 ? completedCount / plannedCount : 0;

  return {
    plannedCount,
    completedCount,
    openCount,
    completionRatio,
  };
}

function countByCategory(tasks: Task[]): Record<string, number> {
  const counts: Record<string, number> = {};

  for (const task of tasks) {
    counts[task.category] = (counts[task.category] ?? 0) + 1;
  }

  return counts;
}

export function collectDailyContext(
  analysisDate: string,
  tasks: Task[],
): DailyContext {
  const currentStartDate = shiftDate(analysisDate, -6);
  const previousEndDate = shiftDate(currentStartDate, -1);
  const previousStartDate = shiftDate(previousEndDate, -6);

  const todayTasks = tasks.filter((task) => task.assignedDate === analysisDate);
  const openTasks = tasks.filter((task) => !isCompleted(task));
  const staleTasks = openTasks.filter(
    (task) => task.assignedDate < analysisDate,
  );
  const completedToday = tasks.filter((task) =>
    wasCompletedOnDate(task, analysisDate),
  );

  const current7dTasks = getTasksAssignedInWindow(
    tasks,
    currentStartDate,
    analysisDate,
  );

  const previous7dTasks = getTasksAssignedInWindow(
    tasks,
    previousStartDate,
    previousEndDate,
  );

  return {
    analysisDate,

    today: {
      taskIds: todayTasks.map((task) => task.id),
      completedIds: completedToday.map((task) => task.id),
      categoryCompletedCounts: countByCategory(completedToday),
    },

    state: {
      openTaskIds: openTasks.map((task) => task.id),
      staleTaskIds: staleTasks.map((task) => task.id),
      categoryOpenCounts: countByCategory(openTasks),
    },

    windows: {
      current7d: {
        startDate: currentStartDate,
        endDate: analysisDate,
        stats: buildWindowStats(current7dTasks),
      },
      previous7d: {
        startDate: previousStartDate,
        endDate: previousEndDate,
        stats: buildWindowStats(previous7dTasks),
      },
    },
  };
}
