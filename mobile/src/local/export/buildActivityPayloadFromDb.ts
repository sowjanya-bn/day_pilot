import type { DailyBriefRepository } from '../storage/repository.ts';
import type { AnalysisRequest, DailyActivityRecord } from '../../remote/analysisClient.ts';
import { shiftDate } from '../../utils/date.ts';

export async function buildActivityPayloadFromDb(
  endDate: string,
  windowDays: number,
  repository: DailyBriefRepository,
): Promise<AnalysisRequest> {
  const days: DailyActivityRecord[] = [];

  for (let i = 0; i < windowDays; i++) {
    const date = shiftDate(endDate, -i);

    const tasks = await repository.getTasksForDate(date);
    const checkin = await repository.getLatestCheckinBefore(shiftDate(date, 1));

    const completed = tasks.filter((task) => task.status === 'completed');
    const outstanding = tasks.filter((task) => task.status === 'outstanding');

    const categories: Record<string, number> = {};
    for (const task of tasks) {
      categories[task.category] = (categories[task.category] ?? 0) + 1;
    }

    days.push({
      date,
      tasks: {
        completed: completed.length,
        outstanding: outstanding.length,
        categories,
      },
      checkin: checkin
        ? { mood: checkin.mood, blockers: checkin.blockers }
        : null,
    });
  }

  return {
    end_date: endDate,
    days,
  };
}
