export type TaskStatus = 'outstanding' | 'completed';

export interface Task {
  id: number;
  title: string;
  category: string;
  source: string;
  status: TaskStatus;
  assignedDate: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
}

export interface TomorrowPlan {
  id: number;
  date: string;
  agenda: string | null;
  topPriorities: string[];
  learningGoal: string | null;
  jobGoal: string | null;
  socialGoal: string | null;
}

export interface DailyCheckin {
  id: number;
  date: string;
  completed: string[];
  incomplete: string[];
  blockers: string[];
  carryForward: string[];
  learned: string | null;
  smallWin: string | null;
  mood: string;
  notes: string | null;
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

export interface DailyStats {
  date: string;
  planningStreak: number;
  checkinStreak: number;
  completedTasksLast7Days: number;
  incompleteTasksLast7Days: number;
}

export interface DailyTaskList {
  date: string;
  outstanding: Task[];
  completed: Task[];
}

export interface CarryForwardGuidance {
  date: string;
  focusMessage: string;
  suggestedLearningNextStep: string;
  suggestedJobNudge: string;
  suggestedSocialNudge: string;
  carryForwardTasks: string[];
}

export interface AgentBriefReflection {
  patterns: string[];
  insight: string | null;
  nextSteps: string[];
}

export interface DailyBrief {
  date: string;
  plan: TomorrowPlan | null;
  yesterdayReflection: DailyCheckin | null;
  guidance: CarryForwardGuidance;
  stats: DailyStats;
  tasks: DailyTaskList;
  reflection: AgentBriefReflection | null;
  debug: {
    findings: PatternFinding[];
    insights: Insight[];
    guidance: GuidanceItem[];
  };
}

export interface AnalysisResponse {
  period: string;
  end_date: string;
  window_days: number;
  findings: PatternFinding[];
  insights: Insight[];
  guidance: GuidanceItem[];
}
