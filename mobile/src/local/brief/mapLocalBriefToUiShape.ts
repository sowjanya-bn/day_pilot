export function mapLocalBriefToUiShape(localBrief: any) {
  const guidance = localBrief?.guidance ?? {};
  const reflection = localBrief?.reflection ?? {};
  const stats = localBrief?.stats ?? {};
  const tasks = localBrief?.tasks ?? {};

  return {
    guidance: {
      focus_message:
        guidance.focusMessage ?? "Keep the day simple and move one important thing forward.",
      suggested_learning_next_step:
        guidance.suggestedLearningNextStep ?? "—",
      suggested_job_nudge:
        guidance.suggestedJobNudge ?? "—",
      suggested_social_nudge:
        guidance.suggestedSocialNudge ?? "—",
      carry_forward_tasks:
        Array.isArray(guidance.carryForwardTasks) ? guidance.carryForwardTasks : [],
    },

    reflection: {
      patterns: Array.isArray(reflection.patterns) ? reflection.patterns : [],
      insight: reflection.insight ?? "",
      guidance: Array.isArray(reflection.nextSteps) ? reflection.nextSteps : [],
    },

    debug: {
      findings: Array.isArray(localBrief?.findings) ? localBrief.findings : [],
      insights: Array.isArray(localBrief?.insights) ? localBrief.insights : [],
    },

    stats: {
      planning_streak: stats.planningStreak ?? 0,
      checkin_streak: stats.checkinStreak ?? 0,
      completed_tasks_last_7_days: stats.completedTasksLast7Days ?? 0,
      incomplete_tasks_last_7_days: stats.incompleteTasksLast7Days ?? 0,
    },

    tasks: {
      outstanding: Array.isArray(tasks.outstanding) ? tasks.outstanding : [],
      completed: Array.isArray(tasks.completed) ? tasks.completed : [],
    },
  };
}