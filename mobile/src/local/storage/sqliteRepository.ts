import type { DailyCheckin, Task, TomorrowPlan } from '../../domain/types.ts';
import type { DailyBriefRepository } from './repository.ts';
import { getDb } from './sqlite.ts';

type TaskRow = {
  id: number;
  title: string;
  category: string;
  status: 'outstanding' | 'completed';
  source: string;
  assigned_date: string;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
};

type PlanRow = {
  id: number;
  date: string;
  agenda: string | null;
  top_priorities_json: string;
  learning_goal: string | null;
  job_goal: string | null;
  social_goal: string | null;
};

type CheckinRow = {
  id: number;
  date: string;
  completed_json: string;
  incomplete_json: string;
  blockers_json: string;
  carry_forward_json: string;
  learned: string | null;
  small_win: string | null;
  mood: string;
  notes: string | null;
};

function parseJsonArray(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function mapTask(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    status: row.status,
    source: row.source,
    assignedDate: row.assigned_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at,
  };
}

function mapPlan(row: PlanRow): TomorrowPlan {
  return {
    id: row.id,
    date: row.date,
    agenda: row.agenda,
    topPriorities: parseJsonArray(row.top_priorities_json),
    learningGoal: row.learning_goal,
    jobGoal: row.job_goal,
    socialGoal: row.social_goal,
  };
}

function mapCheckin(row: CheckinRow): DailyCheckin {
  return {
    id: row.id,
    date: row.date,
    completed: parseJsonArray(row.completed_json),
    incomplete: parseJsonArray(row.incomplete_json),
    blockers: parseJsonArray(row.blockers_json),
    carryForward: parseJsonArray(row.carry_forward_json),
    learned: row.learned,
    smallWin: row.small_win,
    mood: row.mood,
    notes: row.notes,
  };
}

export const sqliteRepository: DailyBriefRepository = {
  async getTasksForDate(date: string): Promise<Task[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<TaskRow>(
      `SELECT * FROM taskentity WHERE assigned_date = ? ORDER BY id`,
      [date],
    );
    return rows.map(mapTask);
  },

  async getTasksInRange(startDate: string, endDate: string): Promise<Task[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<TaskRow>(
      `SELECT * FROM taskentity
       WHERE assigned_date >= ? AND assigned_date <= ?
       ORDER BY assigned_date, id`,
      [startDate, endDate],
    );
    return rows.map(mapTask);
  },

  async getPlanForDate(date: string): Promise<TomorrowPlan | null> {
    const db = await getDb();
    const row = await db.getFirstAsync<PlanRow>(
      `SELECT * FROM tomorrowplanentity WHERE date = ?`,
      [date],
    );
    return row ? mapPlan(row) : null;
  },

  async getLatestCheckinBefore(date: string): Promise<DailyCheckin | null> {
    const db = await getDb();
    const row = await db.getFirstAsync<CheckinRow>(
      `SELECT * FROM dailycheckinentity
       WHERE date < ?
       ORDER BY date DESC
       LIMIT 1`,
      [date],
    );
    return row ? mapCheckin(row) : null;
  },
};
