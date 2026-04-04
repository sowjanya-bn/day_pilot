export type TaskStatus = "outstanding" | "completed";

export interface Task {
  id: number;
  title: string;
  category: string;
  status: TaskStatus;
  source: string;
  assignedDate: string; // YYYY-MM-DD
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
}

export interface TomorrowPlan {
  id: number;
  date: string; // YYYY-MM-DD
  agenda?: string | null;
  topPriorities: string[];
  learningGoal?: string | null;
  jobGoal?: string | null;
  socialGoal?: string | null;
}

export interface DailyCheckin {
  id: number;
  date: string; // YYYY-MM-DD
  completed: string[];
  incomplete: string[];
  blockers: string[];
  carryForward: string[];
  learned?: string | null;
  smallWin?: string | null;
  mood: string;
  notes?: string | null;
}

export interface DailyTaskList {
  date: string;
  outstanding: Task[];
  completed: Task[];
}

export interface DailyStats {
  date: string;
  planningStreak: number;
  checkinStreak: number;
  completedTasksLast7Days: number;
  incompleteTasksLast7Days: number;
}

export interface CarryForwardGuidance {
  date: string;
  carryForwardTasks: string[];
  suggestedLearningNextStep: string;
  suggestedJobNudge: string;
  suggestedSocialNudge: string;
  focusMessage: string;
}

export interface RollingStats {
  plannedCount: number;
  completedCount: number;
  openCount: number;
  completionRatio: number;
}

export interface DailyContext {
  date: string;
  todayTaskIds: number[];
  openTaskIds: number[];
  staleTaskIds: number[];
  completedTodayIds: number[];
  categoryOpenCounts: Record<string, number>;
  categoryCompletedCounts: Record<string, number>;
  rolling7d: RollingStats;
}

export type Severity = "low" | "medium" | "high";
export type Priority = "low" | "medium" | "high";

export interface PatternFinding {
  type: string;
  severity: Severity;
  confidence: number;
  summary: string;
  evidence: Record<string, unknown>;
}

export interface Insight {
  type: string;
  priority: Priority;
  confidence: number;
  message: string;
  supportingPatterns: string[];
}

export interface GuidanceItem {
  type: string;
  priority: Priority;
  title: string;
  message: string;
  action?: string;
  parameters?: Record<string, unknown>;
}

export interface AgentReport {
  date: string;
  findings: PatternFinding[];
  insights: Insight[];
  guidance: GuidanceItem[];
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
}