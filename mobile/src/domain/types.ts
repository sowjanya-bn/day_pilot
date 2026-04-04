export type TaskStatus = "outstanding" | "completed";

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

export type FindingSeverity = "low" | "medium" | "high";

export interface PatternFinding {
  type: string;
  severity: FindingSeverity;
  confidence: number;
  summary: string;
  evidence: Record<string, unknown>;
  score?: number;
  dedupeKey?: string;
}

export interface AgentInsight {
  kind: string;
  message: string;
}

export interface AgentGuidance {
  focusMessage?: string;
  carryForwardTaskIds?: number[];
  nextStep?: string;
}

export interface AgentReport {
  date: string;
  findings: PatternFinding[];
  insights: AgentInsight[];
  guidance: AgentGuidance;
}