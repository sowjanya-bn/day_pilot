import * as SQLite from 'expo-sqlite';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export async function getDb() {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync('daypilot.db');
  }
  return dbPromise;
}

export async function initDb() {
  const db = await getDb();

  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS taskentity (
      id INTEGER PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      status TEXT NOT NULL,
      source TEXT NOT NULL,
      assigned_date TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      completed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS tomorrowplanentity (
      id INTEGER PRIMARY KEY NOT NULL,
      date TEXT NOT NULL UNIQUE,
      agenda TEXT,
      top_priorities_json TEXT NOT NULL,
      learning_goal TEXT,
      job_goal TEXT,
      social_goal TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS dailycheckinentity (
      id INTEGER PRIMARY KEY NOT NULL,
      date TEXT NOT NULL UNIQUE,
      completed_json TEXT NOT NULL,
      incomplete_json TEXT NOT NULL,
      blockers_json TEXT NOT NULL,
      carry_forward_json TEXT NOT NULL,
      learned TEXT,
      small_win TEXT,
      mood TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL
    );
  `);
}

export async function seedDb() {
  const db = await getDb();

  const existingTask = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM taskentity`,
  );

  if ((existingTask?.count ?? 0) > 0) {
    console.log('Seed skipped: DB already has data');
    return;
  }

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT INTO taskentity
        (id, title, category, status, source, assigned_date, created_at, updated_at, completed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        1,
        'Finish app core',
        'work',
        'outstanding',
        'manual',
        '2026-04-01',
        '2026-04-01T09:00:00',
        '2026-04-01T09:00:00',
        null,
      ],
    );

    await db.runAsync(
      `INSERT INTO taskentity
        (id, title, category, status, source, assigned_date, created_at, updated_at, completed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        2,
        'Reply to recruiter',
        'job',
        'outstanding',
        'manual',
        '2026-04-01',
        '2026-04-01T09:10:00',
        '2026-04-01T09:10:00',
        null,
      ],
    );

    await db.runAsync(
      `INSERT INTO taskentity
        (id, title, category, status, source, assigned_date, created_at, updated_at, completed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        3,
        'Read RAG paper',
        'learning',
        'completed',
        'manual',
        '2026-04-01',
        '2026-04-01T09:20:00',
        '2026-04-01T21:00:00',
        '2026-04-01T21:00:00',
      ],
    );

    await db.runAsync(
      `INSERT INTO taskentity
        (id, title, category, status, source, assigned_date, created_at, updated_at, completed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        4,
        'Refine CV bullet',
        'job',
        'completed',
        'manual',
        '2026-04-02',
        '2026-04-02T09:00:00',
        '2026-04-02T18:00:00',
        '2026-04-02T18:00:00',
      ],
    );

    await db.runAsync(
      `INSERT INTO taskentity
        (id, title, category, status, source, assigned_date, created_at, updated_at, completed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        5,
        'Clean inbox',
        'admin',
        'outstanding',
        'manual',
        '2026-04-02',
        '2026-04-02T09:30:00',
        '2026-04-02T09:30:00',
        null,
      ],
    );

    await db.runAsync(
      `INSERT INTO tomorrowplanentity
        (id, date, agenda, top_priorities_json, learning_goal, job_goal, social_goal, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        1,
        '2026-04-03',
        'Recover and finish the app',
        JSON.stringify(['Finish app core', 'Reply recruiter']),
        'RAG',
        'Focus Data science roles',
        'Smile',
        '2026-04-03T08:00:00',
        '2026-04-03T08:00:00',
      ],
    );

    await db.runAsync(
      `INSERT INTO dailycheckinentity
        (id, date, completed_json, incomplete_json, blockers_json, carry_forward_json, learned, small_win, mood, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        1,
        '2026-04-02',
        JSON.stringify(['Read RAG paper', 'Refine CV bullet']),
        JSON.stringify([
          'Finish app core',
          'Reply to recruiter',
          'Clean inbox',
        ]),
        JSON.stringify(['Too many tasks', 'Context switching']),
        JSON.stringify(['Finish app core', 'Reply to recruiter']),
        'Breaking tasks down helps',
        'Finished CV bullet',
        'okay',
        'Still dragging key tasks',
        '2026-04-02T21:00:00',
      ],
    );
  });

  console.log('DB seeded');
}
