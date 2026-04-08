import type { DailyCheckin, Task, TomorrowPlan } from '../../domain/types.ts';

export interface DailyBriefRepository {
  getTasksForDate(date: string): Promise<Task[]>;
  getTasksInRange(startDate: string, endDate: string): Promise<Task[]>;
  getPlanForDate(date: string): Promise<TomorrowPlan | null>;
  getLatestCheckinBefore(date: string): Promise<DailyCheckin | null>;
  getAllPlans(): Promise<TomorrowPlan[]>;
  getAllTaskDates(): Promise<string[]>;
}
