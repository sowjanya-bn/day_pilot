import type { DailyContext, RollingStats, Task } from "../../domain/types.ts";

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
  return task.status === "completed" || !!task.completedAt;
}

function wasCompletedOnDate(task: Task, isoDate: string): boolean {
  if (!task.completedAt) return false;
  return task.completedAt.slice(0, 10) === isoDate;
}

export function collectDailyContext(date: string, tasks: Task[]): DailyContext {
  const windowStart = shiftDate(date, -6);

  const tasksIn7d = tasks.filter(
    (task) => task.assignedDate >= windowStart && task.assignedDate <= date
  );

  const todayTasks = tasks.filter((task) => task.assignedDate === date);
  const openTasks = tasks.filter((task) => !isCompleted(task));
  const staleTasks = openTasks.filter((task) => task.assignedDate < date);
  const completedToday = tasks.filter((task) => wasCompletedOnDate(task, date));

  const categoryOpenCounts: Record<string, number> = {};
  const categoryCompletedCounts: Record<string, number> = {};

  for (const task of openTasks) {
    categoryOpenCounts[task.category] = (categoryOpenCounts[task.category] ?? 0) + 1;
  }

  for (const task of completedToday) {
    categoryCompletedCounts[task.category] =
      (categoryCompletedCounts[task.category] ?? 0) + 1;
  }

  const plannedCount = tasksIn7d.length;
  const completedCount = tasksIn7d.filter(isCompleted).length;
  const openCount = tasksIn7d.filter((task) => !isCompleted(task)).length;
  const completionRatio = plannedCount > 0 ? completedCount / plannedCount : 0;

  const rolling7d: RollingStats = {
    plannedCount,
    completedCount,
    openCount,
    completionRatio,
  };

  return {
    date,
    todayTaskIds: todayTasks.map((task) => task.id),
    openTaskIds: openTasks.map((task) => task.id),
    staleTaskIds: staleTasks.map((task) => task.id),
    completedTodayIds: completedToday.map((task) => task.id),
    categoryOpenCounts,
    categoryCompletedCounts,
    rolling7d,
  };
}