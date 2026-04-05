import type { DailyCheckin, Task, TomorrowPlan } from '../../domain/types.ts';
import type { DailyBriefRepository } from './repository.ts';

const tasks: Task[] = [
  {
    id: 1,
    title: 'Finish app core',
    category: 'work',
    status: 'outstanding',
    source: 'manual',
    assignedDate: '2026-04-01',
    createdAt: '2026-04-01T09:00:00',
    updatedAt: '2026-04-01T09:00:00',
    completedAt: null,
  },
  {
    id: 2,
    title: 'Reply to recruiter',
    category: 'job',
    status: 'outstanding',
    source: 'manual',
    assignedDate: '2026-04-01',
    createdAt: '2026-04-01T09:10:00',
    updatedAt: '2026-04-01T09:10:00',
    completedAt: null,
  },
  {
    id: 3,
    title: 'Read RAG paper',
    category: 'learning',
    status: 'completed',
    source: 'manual',
    assignedDate: '2026-04-01',
    createdAt: '2026-04-01T09:20:00',
    updatedAt: '2026-04-01T21:00:00',
    completedAt: '2026-04-01T21:00:00',
  },
  {
    id: 4,
    title: 'Refine CV bullet',
    category: 'job',
    status: 'completed',
    source: 'manual',
    assignedDate: '2026-04-02',
    createdAt: '2026-04-02T09:00:00',
    updatedAt: '2026-04-02T18:00:00',
    completedAt: '2026-04-02T18:00:00',
  },
  {
    id: 5,
    title: 'Clean inbox',
    category: 'admin',
    status: 'outstanding',
    source: 'manual',
    assignedDate: '2026-04-02',
    createdAt: '2026-04-02T09:30:00',
    updatedAt: '2026-04-02T09:30:00',
    completedAt: null,
  },
];

const plan: TomorrowPlan = {
  id: 1,
  date: '2026-04-03',
  agenda: 'Recover and finish the app',
  topPriorities: ['Finish app core', 'Reply recruiter'],
  learningGoal: 'RAG',
  jobGoal: 'Focus Data science roles',
  socialGoal: 'Smile',
};

const yesterdayCheckin: DailyCheckin = {
  id: 1,
  date: '2026-04-02',
  completed: ['Read RAG paper', 'Refine CV bullet'],
  incomplete: ['Finish app core', 'Reply to recruiter', 'Clean inbox'],
  blockers: ['Too many tasks', 'Context switching'],
  carryForward: ['Finish app core', 'Reply to recruiter'],
  learned: 'Breaking tasks down helps',
  smallWin: 'Finished CV bullet',
  mood: 'okay',
  notes: 'Still dragging key tasks',
};

export const mockRepository: DailyBriefRepository = {
  async getTasksForDate(date: string): Promise<Task[]> {
    return tasks.filter((task) => task.assignedDate === date);
  },

  async getTasksInRange(startDate: string, endDate: string): Promise<Task[]> {
    return tasks.filter(
      (task) => task.assignedDate >= startDate && task.assignedDate <= endDate,
    );
  },

  async getPlanForDate(date: string): Promise<TomorrowPlan | null> {
    return plan.date === date ? plan : null;
  },

  async getLatestCheckinBefore(date: string): Promise<DailyCheckin | null> {
    return yesterdayCheckin.date < date ? yesterdayCheckin : null;
  },
};
