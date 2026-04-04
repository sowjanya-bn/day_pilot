export function mapLocalBriefToUiShape(localBrief: DailyBrief) {
  return {
    date: localBrief.date,
    plan: localBrief.plan
      ? {
          id: localBrief.plan.id,
          date: localBrief.plan.date,
          agenda: localBrief.plan.agenda,
          top_priorities: localBrief.plan.topPriorities,
          learning_goal: localBrief.plan.learningGoal,
          job_goal: localBrief.plan.jobGoal,
          social_goal: localBrief.plan.socialGoal,
        }
      : null,
    yesterday_reflection: localBrief.yesterdayReflection
      ? {
          id: localBrief.yesterdayReflection.id,
          date: localBrief.yesterdayReflection.date,
          completed: localBrief.yesterdayReflection.completed,
          incomplete: localBrief.yesterdayReflection.incomplete,
          blockers: localBrief.yesterdayReflection.blockers,
          carry_forward: localBrief.yesterdayReflection.carryForward,
          learned: localBrief.yesterdayReflection.learned,
          small_win: localBrief.yesterdayReflection.smallWin,
          mood: localBrief.yesterdayReflection.mood,
          notes: localBrief.yesterdayReflection.notes,
        }
      : null,
    guidance: {
      date: localBrief.guidance.date,
      carry_forward_tasks: localBrief.guidance.carryForwardTasks,
      suggested_learning_next_step: localBrief.guidance.suggestedLearningNextStep,
      suggested_job_nudge: localBrief.guidance.suggestedJobNudge,
      suggested_social_nudge: localBrief.guidance.suggestedSocialNudge,
      focus_message: localBrief.guidance.focusMessage,
    },
    stats: {
      date: localBrief.stats.date,
      planning_streak: localBrief.stats.planningStreak,
      checkin_streak: localBrief.stats.checkinStreak,
      completed_tasks_last_7_days: localBrief.stats.completedTasksLast7Days,
      incomplete_tasks_last_7_days: localBrief.stats.incompleteTasksLast7Days,
    },
    tasks: {
      date: localBrief.tasks.date,
      outstanding: localBrief.tasks.outstanding.map((task) => ({
        id: task.id,
        title: task.title,
        category: task.category,
        source: task.source,
        status: task.status,
        assigned_date: task.assignedDate,
        completed_at: task.completedAt,
      })),
      completed: localBrief.tasks.completed.map((task) => ({
        id: task.id,
        title: task.title,
        category: task.category,
        source: task.source,
        status: task.status,
        assigned_date: task.assignedDate,
        completed_at: task.completedAt,
      })),
    },
    reflection: localBrief.reflection
      ? {
          patterns: localBrief.reflection.patterns,
          insight: localBrief.reflection.insight,
          next_steps: localBrief.reflection.nextSteps,
        }
      : null,
  };
}