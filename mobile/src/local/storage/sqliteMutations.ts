import { getDb } from "./sqlite.ts";

function nowIso(): string {
  return new Date().toISOString();
}

export type CreateTaskInput = {
  date: string;
  title: string;
  category: string;
  source: string;
};

export type SavePlanInput = {
  date: string;
  agenda: string | null;
  top_priorities: string[];
  learning_goal: string | null;
  job_goal: string | null;
  social_goal: string | null;
};

export type SaveCheckinInput = {
  date: string;
  completed: string[];
  incomplete: string[];
  blockers: string[];
  carry_forward: string[];
  learned: string | null;
  small_win: string | null;
  mood: string;
  notes: string | null;
};

export async function addTaskLocal(input: CreateTaskInput): Promise<void> {
  const db = await getDb();
  const timestamp = nowIso();

  await db.runAsync(
    `INSERT INTO taskentity
      (title, category, status, source, assigned_date, created_at, updated_at, completed_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.title,
      input.category,
      "outstanding",
      input.source,
      input.date,
      timestamp,
      timestamp,
      null,
    ]
  );
}

export async function updateTaskStatusLocal(
  taskId: number,
  nextStatus: "outstanding" | "completed"
): Promise<void> {
  const db = await getDb();
  const timestamp = nowIso();
  const completedAt = nextStatus === "completed" ? timestamp : null;

  await db.runAsync(
    `UPDATE taskentity
     SET status = ?, updated_at = ?, completed_at = ?
     WHERE id = ?`,
    [nextStatus, timestamp, completedAt, taskId]
  );
}

export async function savePlanLocal(input: SavePlanInput): Promise<void> {
  const db = await getDb();
  const timestamp = nowIso();

  await db.runAsync(
    `INSERT INTO tomorrowplanentity
      (date, agenda, top_priorities_json, learning_goal, job_goal, social_goal, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(date) DO UPDATE SET
       agenda = excluded.agenda,
       top_priorities_json = excluded.top_priorities_json,
       learning_goal = excluded.learning_goal,
       job_goal = excluded.job_goal,
       social_goal = excluded.social_goal,
       updated_at = excluded.updated_at`,
    [
      input.date,
      input.agenda,
      JSON.stringify(input.top_priorities),
      input.learning_goal,
      input.job_goal,
      input.social_goal,
      timestamp,
      timestamp,
    ]
  );
}

export async function saveCheckinLocal(input: SaveCheckinInput): Promise<void> {
  const db = await getDb();
  const timestamp = nowIso();

  await db.runAsync(
    `INSERT INTO dailycheckinentity
      (date, completed_json, incomplete_json, blockers_json, carry_forward_json, learned, small_win, mood, notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(date) DO UPDATE SET
       completed_json = excluded.completed_json,
       incomplete_json = excluded.incomplete_json,
       blockers_json = excluded.blockers_json,
       carry_forward_json = excluded.carry_forward_json,
       learned = excluded.learned,
       small_win = excluded.small_win,
       mood = excluded.mood,
       notes = excluded.notes`,
    [
      input.date,
      JSON.stringify(input.completed),
      JSON.stringify(input.incomplete),
      JSON.stringify(input.blockers),
      JSON.stringify(input.carry_forward),
      input.learned,
      input.small_win,
      input.mood,
      input.notes,
      timestamp,
    ]
  );
}