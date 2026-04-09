import type { InputTask } from './context';

import { API_BASE as BASE_URL } from '../config';
const API_BASE = `${BASE_URL}/api`;

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
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 40000); // 40s for cold start

  console.log('Fetching daily snippet with tasks:', tasks);

  try {
    const res = await fetch(`${API_BASE}/briefing/daily`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tasks, max_learn: 5, max_pulse: 5, max_tools: 3 }),
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`Briefing request failed: ${res.status}`);
    }

    return res.json();
  } finally {
    clearTimeout(timeout);
  }
}
