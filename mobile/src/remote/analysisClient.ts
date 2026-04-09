import type { AnalysisResponse } from '../domain/types.ts';
import { API_BASE } from '../config.ts';

export type AnalysisPeriod = 'weekly' | 'fortnightly' | 'monthly';

export type CheckinSummary = {
  mood: string;
  blockers: string[];
};

export type TaskDaySummary = {
  completed: number;
  outstanding: number;
  categories: Record<string, number>;
};

export type DailyActivityRecord = {
  date: string;
  tasks: TaskDaySummary;
  checkin: CheckinSummary | null;
};

export type AnalysisRequest = {
  end_date: string;
  days: DailyActivityRecord[];
};

export async function fetchAnalysis(
  payload: AnalysisRequest,
  period: AnalysisPeriod = 'weekly',
): Promise<AnalysisResponse> {
  const url = `${API_BASE}/api/analysis?period=${period}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Analysis request failed: ${res.status}`);
  }

  return res.json();
}
