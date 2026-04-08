export type InputTask = {
  id: string;
  title: string;
  status: "planned" | "completed" | "cancelled";
  assigned_date: string; // YYYY-MM-DD
  category?: string | null;
  priority?: number | null;
  defer_count?: number;
};

export type FocusItem = {
  task_id: string;
  title: string;
  reason: string;
  score: number;
};

export type OutstandingItem = {
  task_id: string;
  title: string;
  note: string;
};

export type NewsItem = {
  title: string;
  source: string;
  url: string;
  relevance_note: string;
};

export type ContextTodayResponse = {
  date: string;
  summary_line: string;
  focus: FocusItem[];
  outstanding: OutstandingItem[];
  news: NewsItem[];
  nudge?: string | null;
};

const API_BASE = "http://127.0.0.1:8000/api";

export async function fetchTodayContext(tasks: InputTask[]): Promise<ContextTodayResponse> {
  const res = await fetch(`${API_BASE}/context/today`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      tasks,
      include_news: true,
      max_focus: 2,
      max_outstanding: 1,
      max_news: 2,
    }),
  });

  if (!res.ok) {
    throw new Error(`Context request failed: ${res.status}`);
  }

  return res.json();
}