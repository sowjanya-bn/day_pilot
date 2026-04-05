export type TaskStatus = 'outstanding' | 'completed';

export interface Task {
  id: number;
  title: string;
  category: string;
  source: string;
  status: TaskStatus;
  assignedDate: string;
  completedAt?: string | null;
}

export interface WindowStats {
  plannedCount: number;
  completedCount: number;
  openCount: number;
  completionRatio: number;
}

export interface DailyContext {
  analysisDate: string;
  today: {
    taskIds: number[];
    completedIds: number[];
    categoryCompletedCounts: Record<string, number>;
  };
  state: {
    openTaskIds: number[];
    staleTaskIds: number[];
    categoryOpenCounts: Record<string, number>;
  };
  windows: {
    current7d: {
      startDate: string;
      endDate: string;
      stats: WindowStats;
    };
    previous7d: {
      startDate: string;
      endDate: string;
      stats: WindowStats;
    };
  };
}

export type FindingSeverity = 'low' | 'medium' | 'high';

export interface PatternFinding {
  type: string;
  severity: FindingSeverity;
  confidence: number;
  summary: string;
  evidence: Record<string, unknown>;
  score?: number;
  dedupeKey?: string;
}

export interface Insight {
  type: string;
  message: string;
}

export type GuidancePriority = 'low' | 'medium' | 'high';

export interface GuidanceItem {
  type: string;
  priority: GuidancePriority;
  title: string;
  message: string;
  action: string;
  parameters?: Record<string, unknown>;
}

export interface AgentReport {
  date: string;
  findings: PatternFinding[];
  insights: Insight[];
  guidance: GuidanceItem[];
}
