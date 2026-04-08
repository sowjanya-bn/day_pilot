import type { InputTask } from './context';

const API_BASE = 'http://127.0.0.1:8000/api';

export type SnippetItem = {
  title: string;
  url: string;
  source: string;
  relevance_note: string;
};

export type DailySnippet = {
  date: string;
  topics: string[];
  learn: SnippetItem[];
  pulse: SnippetItem[];
  tools: SnippetItem[];
};

export async function fetchDailySnippet(tasks: InputTask[]): Promise<DailySnippet> {
  const res = await fetch(`${API_BASE}/briefing/daily`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tasks, max_learn: 5, max_pulse: 5, max_tools: 3 }),
  });

  if (!res.ok) {
    throw new Error(`Briefing request failed: ${res.status}`);
  }

  return res.json();
}
