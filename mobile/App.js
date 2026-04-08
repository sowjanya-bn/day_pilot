import React, { useEffect, useMemo, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';

import { getDailyBriefLocal } from './src/local/brief/getDailyBriefLocal.ts';
import { sqliteRepository } from './src/local/storage/sqliteRepository';
import { mapLocalBriefToUiShape } from './src/local/brief/mapLocalBriefToUiShape.ts';
import { initDb, seedDb } from './src/local/storage/sqlite.ts';
import { evaluatePlan } from './src/local/agent/interventions/evaluatePlan.ts';
import { deferTaskByOneDay } from './src/local/storage/sqliteMutations.ts';

import {
  addTaskLocal,
  updateTaskStatusLocal,
  savePlanLocal,
  saveCheckinLocal,
} from './src/local/storage/sqliteMutations.ts';

import { buildActivityPayloadFromDb } from './src/local/export/buildActivityPayloadFromDb.ts';
import { analyzeActivity } from './src/remote/analysisClient.ts';
import { fetchDailySnippet } from './src/api/briefing.ts';
import { DailySnippetCard } from './src/features/briefing/DailySnippetCard.tsx';

const API_BASE_URL = 'http://localhost:8000/api';
const DEFAULT_DATE = getLocalIsoDate();

function toAppErrorDetails(error, extra) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      cause:
        error.cause instanceof Error
          ? `${error.cause.name}: ${error.cause.message}`
          : error.cause
            ? String(error.cause)
            : undefined,
      extra,
    };
  }

  return {
    name: 'UnknownError',
    message: typeof error === 'string' ? error : JSON.stringify(error, null, 2),
    extra,
  };
}

function getErrorDisplayText(error) {
  if (!error) return '';
  return error.name ? `${error.name}: ${error.message}` : error.message;
}

async function apiPost(path, payload) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed: ${response.status}`);
  }

  return response.json();
}

async function apiPut(path, payload) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed: ${response.status}`);
  }

  return response.json();
}

function shiftDate(isoDate, days) {
  const [year, month, day] = isoDate.split('-').map(Number);
  const d = new Date(Date.UTC(year, month - 1, day));
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function sentenceCase(text) {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

function capitalize(value) {
  if (!value) return '';
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getLocalIsoDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatFriendlyDate(isoDate) {
  const [year, month, day] = isoDate.split('-').map(Number);
  const d = new Date(Date.UTC(year, month - 1, day));
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

function formatShortReflection(patterns) {
  if (!Array.isArray(patterns) || patterns.length === 0) {
    return 'No strong signals today.';
  }

  if (patterns.length === 1) {
    return patterns[0];
  }

  return `${patterns[0]} + ${patterns.length - 1} more`;
}

export default function App() {
  const USE_LOCAL_BRIEF = true;

  const [brief, setBrief] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [screen, setScreen] = useState('today');

  const [selectedDate, setSelectedDate] = useState(DEFAULT_DATE);

  const [planDate, setPlanDate] = useState(DEFAULT_DATE);
  const [agenda, setAgenda] = useState('');
  const [topPrioritiesText, setTopPrioritiesText] = useState('');
  const [learningGoal, setLearningGoal] = useState('');
  const [jobGoal, setJobGoal] = useState('');
  const [socialGoal, setSocialGoal] = useState('');
  const [submittingPlan, setSubmittingPlan] = useState(false);

  const [checkinDate, setCheckinDate] = useState(DEFAULT_DATE);
  const [completedText, setCompletedText] = useState('');
  const [incompleteText, setIncompleteText] = useState('');
  const [blockersText, setBlockersText] = useState('');
  const [learnedText, setLearnedText] = useState('');
  const [smallWinText, setSmallWinText] = useState('');
  const [mood, setMood] = useState('steady');
  const [notes, setNotes] = useState('');
  const [submittingCheckin, setSubmittingCheckin] = useState(false);

  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [generatingDraft, setGeneratingDraft] = useState(false);

  const [newTask, setNewTask] = useState('');

  const [showReflectionDetails, setShowReflectionDetails] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [dateDraft, setDateDraft] = useState(DEFAULT_DATE);
  const [planInterventions, setPlanInterventions] = useState([]);

  const [analysisWindow, setAnalysisWindow] = useState(7);
const [weeklyInsights, setWeeklyInsights] = useState(null);
const [analyzingActivity, setAnalyzingActivity] = useState(false);

const [snippet, setSnippet] = useState(null);
const [loadingSnippet, setLoadingSnippet] = useState(false);

const [allPlans, setAllPlans] = useState([]);
const [expandedPlanDate, setExpandedPlanDate] = useState(null);

const runActivityAnalysis = async () => {
  try {
    setAnalyzingActivity(true);
    setError(null);

    const payload = await buildActivityPayloadFromDb(
      selectedDate,
      analysisWindow,
      sqliteRepository,
    );

    const result = await analyzeActivity(payload);
    setWeeklyInsights(result);
  } catch (err) {
    setError(
      toAppErrorDetails(err, {
        screen: 'App',
        action: 'runActivityAnalysis',
        selectedDate,
        analysisWindow,
      }),
    );
  } finally {
    setAnalyzingActivity(false);
  }
};

const runDailySnippet = async () => {
  try {
    setLoadingSnippet(true);
    setError(null);

    const allTasks = [
      ...(localTasks.outstanding || []).map((t) => ({
        id: String(t.id),
        title: t.title,
        status: 'planned',
        assigned_date: t.assignedDate || selectedDate,
        category: t.category || null,
        priority: null,
        defer_count: 0,
      })),
      ...(localTasks.completed || []).map((t) => ({
        id: String(t.id),
        title: t.title,
        status: 'completed',
        assigned_date: t.assignedDate || selectedDate,
        category: t.category || null,
        priority: null,
        defer_count: 0,
      })),
    ];

    const result = await fetchDailySnippet(allTasks);
    setSnippet(result);
  } catch (err) {
    setError(
      toAppErrorDetails(err, {
        screen: 'App',
        action: 'runDailySnippet',
        selectedDate,
      }),
    );
  } finally {
    setLoadingSnippet(false);
  }
};

  const [localTasks, setLocalTasks] = useState({
    outstanding: [],
    completed: [],
  });

  const loadAllPlans = async () => {
    try {
      const plans = await sqliteRepository.getAllPlans();
      setAllPlans(plans);
    } catch (err) {
      console.error('Failed to load plans', err);
    }
  };

  const loadBrief = async (day = selectedDate) => {
    try {
      setLoading(true);
      setError(null);

      if (USE_LOCAL_BRIEF) {
        const localBrief = await getDailyBriefLocal(day, sqliteRepository);
        const uiBrief = mapLocalBriefToUiShape(localBrief);
        //        console.log("Loaded brief from local DB", { day, localBrief, uiBrief });
        //
        //        console.log("Mapping local brief to UI shape:");
        //      console.log("Raw local brief:", JSON.stringify(localBrief, null, 2));
        //      console.log("Extracted uiBrief:", JSON.stringify(uiBrief, null, 2));
        setBrief(uiBrief);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/daily-brief/${day}`);
      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
      }

      const data = await response.json();
      setBrief(data);
    } catch (err) {
      const details = toAppErrorDetails(err, {
        screen: 'App',
        action: 'loadBrief',
        day,
        selectedDate,
      });

      console.error('Daily brief load failed', details);
      setBrief(null);
      setError(details);
    } finally {
      setLoading(false);
    }
  };

  const changeDateAndLoad = async (newDate) => {
    setSelectedDate(newDate);
    setDateDraft(newDate);
    await loadBrief(newDate);
  };

  useEffect(() => {
    async function setup() {
      try {
        await initDb();
        await seedDb();
        await loadAllPlans();
        console.log('DB initialized');
      } catch (err) {
        const details = toAppErrorDetails(err, {
          screen: 'App',
          action: 'setup',
        });
        console.error('DB init failed', details);
        setError(details);
      }
    }

    setup();
  }, []);

  useEffect(() => {
    if (!brief?.tasks) return;

    setLocalTasks({
      outstanding: Array.isArray(brief.tasks.outstanding)
        ? brief.tasks.outstanding
        : [],
      completed: Array.isArray(brief.tasks.completed)
        ? brief.tasks.completed
        : [],
    });
  }, [brief]);

  useEffect(() => {
  const outstanding = Array.isArray(localTasks?.outstanding)
    ? localTasks.outstanding
    : [];

  const interventions = evaluatePlan(outstanding, {
    state: {
      staleTaskIds: outstanding.map((task) => task.id),
    },
  });

  setPlanInterventions(interventions);
}, [localTasks]);

  useEffect(() => {
    loadBrief(DEFAULT_DATE);
  }, []);

  useEffect(() => {
    setPlanDate(selectedDate);
    setCheckinDate(selectedDate);
    setDateDraft(selectedDate);
  }, [selectedDate]);

  const pasteTranscriptFromClipboard = async () => {
    try {
      const text = await Clipboard.getStringAsync();
      if (text) {
        setVoiceTranscript(text);
      }
    } catch (err) {
      setError(
        toAppErrorDetails(err, {
          screen: 'App',
          action: 'pasteTranscriptFromClipboard',
        }),
      );
    }
  };

  const goToPreviousDay = async () => {
    const newDate = shiftDate(selectedDate, -1);
    await changeDateAndLoad(newDate);
  };

  const goToNextDay = async () => {
    const newDate = shiftDate(selectedDate, 1);
    await changeDateAndLoad(newDate);
  };

  const goToToday = async () => {
    const today = getLocalIsoDate();
    await changeDateAndLoad(today);
  };

  const submitTypedDate = async () => {
    if (!dateDraft?.trim()) return;
    await changeDateAndLoad(dateDraft.trim());
  };

  const generateCheckinDraft = async () => {
    try {
      setGeneratingDraft(true);
      setError(null);

      const payload = {
        date: checkinDate,
        transcript: voiceTranscript,
      };

      const draft = await apiPost('/checkin/voice-draft', payload);

      setCompletedText((draft.completed || []).join('\n'));
      setIncompleteText((draft.incomplete || []).join('\n'));
      setBlockersText((draft.blockers || []).join('\n'));
      setLearnedText(draft.learned || '');
      setSmallWinText(draft.small_win || '');
      setMood(draft.mood || 'steady');
      setNotes(draft.notes || '');
    } catch (err) {
      setError(
        toAppErrorDetails(err, {
          screen: 'App',
          action: 'generateCheckinDraft',
          checkinDate,
        }),
      );
    } finally {
      setGeneratingDraft(false);
    }
  };

  const addTask = async () => {
    try {
      if (!newTask.trim()) return;

      setError(null);

      await addTaskLocal({
        date: selectedDate,
        title: newTask.trim(),
        category: 'general',
        source: 'manual',
      });

      setNewTask('');
      await loadBrief(selectedDate);
    } catch (err) {
      setError(
        toAppErrorDetails(err, {
          screen: 'App',
          action: 'addTask',
          selectedDate,
          title: newTask,
        }),
      );
    }
  };

  const deferTask = async (taskId) => {
    try {
      setError(null);

      setLocalTasks((prev) => ({
        ...prev,
        outstanding: prev.outstanding.filter((t) => t.id !== taskId),
      }));

      await deferTaskByOneDay(taskId);
      await loadBrief(selectedDate);
    } catch (err) {
      await loadBrief(selectedDate);
      setError(
        toAppErrorDetails(err, {
          screen: 'App',
          action: 'deferTask',
          taskId,
          selectedDate,
        }),
      );
    }
  };

  const toggleTaskStatus = async (taskId, nextStatus) => {
    try {
      setError(null);

      const task =
        localTasks.outstanding.find((t) => t.id === taskId) ||
        localTasks.completed.find((t) => t.id === taskId);

      if (!task) {
        await updateTaskStatusLocal(taskId, nextStatus);
        await loadBrief(selectedDate);
        return;
      }

      if (nextStatus === 'completed') {
        const updatedTask = {
          ...task,
          status: 'completed',
          completedAt: new Date().toISOString(),
        };

        setLocalTasks((prev) => ({
          outstanding: prev.outstanding.filter((t) => t.id !== taskId),
          completed: [updatedTask, ...prev.completed],
        }));
      } else {
        const updatedTask = {
          ...task,
          status: 'outstanding',
          completedAt: null,
        };

        setLocalTasks((prev) => ({
          outstanding: [
            updatedTask,
            ...prev.outstanding.filter((t) => t.id !== taskId),
          ],
          completed: prev.completed.filter((t) => t.id !== taskId),
        }));
      }

      await updateTaskStatusLocal(taskId, nextStatus);
      await loadBrief(selectedDate);
    } catch (err) {
      await loadBrief(selectedDate);
      setError(
        toAppErrorDetails(err, {
          screen: 'App',
          action: 'toggleTaskStatus',
          taskId,
          nextStatus,
          selectedDate,
        }),
      );
    }
  };

  const submitPlan = async () => {
    try {
      setSubmittingPlan(true);
      setError(null);

      const payload = {
        date: planDate,
        agenda: agenda || null,
        top_priorities: topPrioritiesText
          .split('\n')
          .map((item) => item.trim())
          .filter(Boolean),
        learning_goal: learningGoal || null,
        job_goal: jobGoal || null,
        social_goal: socialGoal || null,
      };

      await savePlanLocal(payload);
      await loadAllPlans();
      await changeDateAndLoad(planDate);
      setScreen('today');
    } catch (err) {
      setError(
        toAppErrorDetails(err, {
          screen: 'App',
          action: 'submitPlan',
          planDate,
        }),
      );
    } finally {
      setSubmittingPlan(false);
    }
  };

  const submitCheckin = async () => {
    try {
      setSubmittingCheckin(true);
      setError(null);

      const completed = completedText
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean);

      const incomplete = incompleteText
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean);

      const blockers = blockersText
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean);

      const payload = {
        date: checkinDate,
        completed,
        incomplete,
        blockers,
        carry_forward: incomplete,
        learned: learnedText || null,
        small_win: smallWinText || null,
        mood: mood || 'steady',
        notes: notes || null,
      };

      await saveCheckinLocal(payload);
      await changeDateAndLoad(checkinDate);
      setScreen('today');
    } catch (err) {
      setError(
        toAppErrorDetails(err, {
          screen: 'App',
          action: 'submitCheckin',
          checkinDate,
        }),
      );
    } finally {
      setSubmittingCheckin(false);
    }
  };

  const guidance = brief?.guidance ?? {};
  const stats = brief?.stats ?? {};
  const reflection = brief?.reflection ?? {};
  const debug = brief?.debug ?? {};
  const tasks = brief?.tasks ?? {};

  const renderActivityAnalysis = () => (
  <Card title="Analyze my activity">
    <View style={styles.analysisControls}>
      {[3, 7, 14].map((days) => (
        <Pressable
          key={days}
          style={[
            styles.analysisChip,
            analysisWindow === days && styles.analysisChipActive,
          ]}
          onPress={() => setAnalysisWindow(days)}
        >
          <Text
            style={[
              styles.analysisChipText,
              analysisWindow === days && styles.analysisChipTextActive,
            ]}
          >
            {days}d
          </Text>
        </Pressable>
      ))}
    </View>

    <Pressable
      style={styles.primaryButton}
      onPress={runActivityAnalysis}
      disabled={analyzingActivity}
    >
      <Text style={styles.primaryButtonText}>
        {analyzingActivity ? 'Analyzing...' : 'Run analysis'}
      </Text>
    </Pressable>

    {weeklyInsights ? (
      <View style={styles.expandedSection}>
        {Array.isArray(weeklyInsights.patterns) &&
          weeklyInsights.patterns.length > 0 && (
            <>
              <Text style={styles.label}>Patterns</Text>
              {weeklyInsights.patterns.map((pattern, index) => (
                <Text key={`weekly-pattern-${index}`} style={styles.listItem}>
                  • {pattern}
                </Text>
              ))}
            </>
          )}

        {Array.isArray(weeklyInsights.insights) &&
          weeklyInsights.insights.length > 0 && (
            <>
              <Text style={styles.label}>Insights</Text>
              {weeklyInsights.insights.map((insight, index) => (
                <Text key={`weekly-insight-${index}`} style={styles.listItem}>
                  • {insight}
                </Text>
              ))}
            </>
          )}

        {Array.isArray(weeklyInsights.recommendations) &&
          weeklyInsights.recommendations.length > 0 && (
            <>
              <Text style={styles.label}>Recommendation</Text>
              <Text style={styles.value}>
                {weeklyInsights.recommendations[0]}
              </Text>
            </>
          )}
      </View>
    ) : null}
  </Card>
);

  const staleTaskTitles = useMemo(() => {
    const carryForward = Array.isArray(guidance?.carry_forward_tasks)
      ? guidance.carry_forward_tasks
      : [];
    return carryForward;
  }, [guidance]);

  const renderGlobalDatePanel = () => (
    <View style={styles.dateToolbar}>
      <TextInput
        value={dateDraft}
        onChangeText={setDateDraft}
        onSubmitEditing={submitTypedDate}
        style={styles.dateToolbarInput}
        placeholder="YYYY-MM-DD"
        autoCapitalize="none"
        autoCorrect={false}
      />

      <Pressable style={styles.dateToolbarButton} onPress={goToPreviousDay}>
        <Text style={styles.dateToolbarButtonText}>← Prev</Text>
      </Pressable>

      <Pressable style={styles.dateToolbarButton} onPress={goToToday}>
        <Text style={styles.dateToolbarButtonText}>Today</Text>
      </Pressable>

      <Pressable style={styles.dateToolbarButton} onPress={goToNextDay}>
        <Text style={styles.dateToolbarButtonText}>Next →</Text>
      </Pressable>
    </View>
  );

  const renderBrief = () => {
    const shortPatterns = Array.isArray(reflection?.patterns)
      ? reflection.patterns
      : [];
    const nextSteps = Array.isArray(reflection?.guidance)
      ? reflection.guidance
      : [];

    const hasMoreReflection = shortPatterns.length > 1 || nextSteps.length > 1;

    return (
      <>
        <Card title="Today" style={styles.todayCard}>
          <Text style={styles.focusText}>
            {guidance?.focus_message || 'No guidance yet.'}
          </Text>

          <View style={styles.statChipsRow}>
            <StatChip label="Plan" value={stats?.planning_streak ?? 0} />
            <StatChip label="Check-in" value={stats?.checkin_streak ?? 0} />
            <StatChip
              label="Done 7d"
              value={stats?.completed_tasks_last_7_days ?? 0}
            />
            <StatChip
              label="Open 7d"
              value={stats?.incomplete_tasks_last_7_days ?? 0}
            />
          </View>

          <Text style={styles.label}>Learning</Text>
          <Text style={styles.value}>
            {guidance?.suggested_learning_next_step || '—'}
          </Text>

          <Text style={styles.label}>Job</Text>
          <Text style={styles.value}>
            {guidance?.suggested_job_nudge || '—'}
          </Text>

          <Text style={styles.label}>Social</Text>
          <Text style={styles.value}>
            {guidance?.suggested_social_nudge || '—'}
          </Text>
        </Card>

        <View style={{ marginHorizontal: 16, marginTop: 12 }}>
          <Pressable
            style={[styles.primaryButton, loadingSnippet && { opacity: 0.6 }]}
            onPress={runDailySnippet}
            disabled={loadingSnippet}
          >
            <Text style={styles.primaryButtonText}>
              {loadingSnippet ? 'Building briefing...' : 'Get daily briefing'}
            </Text>
          </Pressable>
        </View>

        {snippet && <DailySnippetCard snippet={snippet} />}

        {shortPatterns.length > 0 || reflection?.insight ? (
          <Card title="Reflection">
            {/* Insight */}
            {reflection?.insight ? (
              <>
                <Text style={styles.label}>Insight</Text>
                <Text
                  numberOfLines={showReflectionDetails ? undefined : 4}
                  style={styles.value}
                >
                  {reflection.insight}
                </Text>
              </>
            ) : null}

            {/* Patterns (short) */}
            {shortPatterns.length > 0 && (
              <>
                <Text style={styles.label}>Patterns</Text>
                <Text style={styles.value}>
                  {formatShortReflection(shortPatterns)}
                </Text>
              </>
            )}

            {/* Next step */}
            {nextSteps.length > 0 && (
              <>
                <Text style={styles.label}>Next step</Text>
                <Text style={styles.value}>{nextSteps[0]}</Text>
              </>
            )}

            {/* Toggle */}
            {hasMoreReflection && (
              <Pressable
                style={styles.inlineToggle}
                onPress={() => setShowReflectionDetails((prev) => !prev)}
              >
                <Text style={styles.inlineToggleText}>
                  {showReflectionDetails ? 'Show less' : 'Show more'}
                </Text>
              </Pressable>
            )}

            {/* Expanded */}
            {showReflectionDetails && (
              <View style={styles.expandedSection}>
                {/* All patterns */}
                {shortPatterns.length > 0 && (
                  <>
                    <Text style={styles.label}>All patterns</Text>
                    {shortPatterns.map((p, i) => (
                      <Text key={`pattern-${i}`} style={styles.listItem}>
                        • {p}
                      </Text>
                    ))}
                  </>
                )}

                {/* Additional steps */}
                {nextSteps.length > 1 && (
                  <>
                    <Text style={styles.label}>More options</Text>
                    {nextSteps.slice(1).map((g, i) => (
                      <Text key={`step-${i}`} style={styles.listItem}>
                        • {g}
                      </Text>
                    ))}
                  </>
                )}
              </View>
            )}
          </Card>
        ) : null}

        {__DEV__ && (
          <Card title="Debug">
            <Pressable
              style={styles.inlineToggle}
              onPress={() => setShowDebug((prev) => !prev)}
            >
              <Text style={styles.inlineToggleText}>
                {showDebug ? 'Hide debug details' : 'Show debug details'}
              </Text>
            </Pressable>

            {showDebug && (
              <View style={styles.expandedSection}>
                {Array.isArray(reflection?.patterns) &&
                  reflection.patterns.length > 0 && (
                    <>
                      <Text style={styles.label}>Patterns</Text>
                      {reflection.patterns.map((p, i) => (
                        <Text key={i} style={styles.listItem}>
                          • {sentenceCase(p)}
                        </Text>
                      ))}
                    </>
                  )}

                {Array.isArray(debug?.guidance) &&
                  debug.guidance.length > 0 && (
                    <>
                      <Text style={styles.label}>Guidance</Text>
                      {debug.guidance.map((item, index) => (
                        <View style={styles.debugItem}>
                          <Text style={styles.debugItemTitle}>
                            {item.title}
                          </Text>
                          <Text style={styles.debugItemMeta}>
                            {item.priority}
                          </Text>
                          <Text style={styles.value}>{item.message}</Text>
                        </View>
                      ))}
                    </>
                  )}

                {Array.isArray(debug?.findings) &&
                  debug.findings.length > 0 && (
                    <>
                      <Text style={styles.label}>Findings</Text>
                      {debug.findings.map((finding, index) => (
                        <Text
                          style={[
                            styles.listItem,
                            styles[`severity${capitalize(finding.severity)}`],
                          ]}
                        >
                          • {finding.type.replace('_', ' ')}
                          <Text style={styles.meta}>
                            {' '}
                            · {finding.severity.toUpperCase()} ·{' '}
                            {Math.round(finding.confidence * 100)}%
                          </Text>
                        </Text>
                      ))}
                    </>
                  )}

                {Array.isArray(debug?.insights) &&
                  debug.insights.length > 0 && (
                    <>
                      <Text style={styles.label}>Insights</Text>
                      {debug.insights.map((insight, index) => (
                        <Text key={index} style={styles.listItem}>
                          • {insight.message}
                        </Text>
                      ))}
                    </>
                  )}
              </View>
            )}
          </Card>
        )}
      </>
    );
  };

  const renderTasks = () => (
    <>
      <View style={styles.tabDateLabel}>
        <Text style={styles.tabDateLabelText}>
          {formatFriendlyDate(selectedDate)}
        </Text>
        <Text style={styles.tabDateLabelHint}>Use ‹ › above to browse days</Text>
      </View>

      {planInterventions.length > 0 && (
        <View style={styles.nudge}>
          <Text style={styles.nudgeText}>{planInterventions[0].message}</Text>
        </View>
      )}
      {staleTaskTitles.length > 0 && (
        <Card title="Needs attention">
          <Text style={styles.value}>
            These tasks have been carried forward and probably deserve a proper
            reset.
          </Text>

          <View style={styles.compactList}>
            {staleTaskTitles.map((task, index) => (
              <Text key={index} style={styles.listItem}>
                • {String(task)}
              </Text>
            ))}
          </View>
        </Card>
      )}

      <Card title="Add task">
        <TextInput
          value={newTask}
          onChangeText={setNewTask}
          placeholder="What needs to be done?"
          style={styles.input}
        />

        <Pressable style={styles.primaryButton} onPress={addTask}>
          <Text style={styles.primaryButtonText}>Add</Text>
        </Pressable>
      </Card>

      <Card title="Outstanding tasks">
        {localTasks.outstanding.length ? (
          localTasks.outstanding.map((task) => (
            <View key={task.id} style={styles.taskRow}>
              <View style={styles.taskTextBlock}>
                <Text style={styles.taskText}>{task.title}</Text>
                <Text style={styles.taskMeta}>
                  {task.category} · {task.source}
                </Text>
              </View>
              <Pressable
                style={styles.taskActionButton}
                onPress={() => toggleTaskStatus(task.id, 'completed')}
              >
                <Text style={styles.taskActionButtonText}>Done</Text>
              </Pressable>
              <Pressable
                style={styles.taskDeferButton}
                onPress={() => deferTask(task.id)}
              >
                <Text style={styles.taskDeferButtonText}>Defer</Text>
              </Pressable>
            </View>
          ))
        ) : (
          <Text style={styles.muted}>No outstanding tasks</Text>
        )}
      </Card>

      <Card title="Completed today">
        {localTasks.completed.length ? (
          localTasks.completed.map((task) => (
            <View key={task.id} style={styles.taskRow}>
              <View style={styles.taskTextBlock}>
                <Text style={styles.completedTaskText}>{task.title}</Text>
                <Text style={styles.taskMeta}>
                  {task.category} · {task.source}
                </Text>
              </View>
              <Pressable
                style={styles.taskUndoButton}
                onPress={() => toggleTaskStatus(task.id, 'outstanding')}
              >
                <Text style={styles.taskUndoButtonText}>Undo</Text>
              </Pressable>
            </View>
          ))
        ) : (
          <Text style={styles.muted}>No completed tasks today</Text>
        )}
      </Card>
    </>
  );

  const renderPlanForm = () => (
    <>
      {allPlans.length > 0 && (
        <Card title="All plans">
          {allPlans.map((plan) => {
            const isExpanded = expandedPlanDate === plan.date;
            return (
              <Pressable
                key={plan.date}
                onPress={() => setExpandedPlanDate(isExpanded ? null : plan.date)}
                style={styles.planRow}
              >
                <View style={styles.planRowHeader}>
                  <Text style={styles.planRowDate}>
                    {formatFriendlyDate(plan.date)}
                  </Text>
                  {plan.agenda ? (
                    <Text style={styles.planRowAgenda} numberOfLines={1}>
                      {plan.agenda}
                    </Text>
                  ) : null}
                  <Text style={styles.planRowChevron}>{isExpanded ? '∧' : '∨'}</Text>
                </View>

                {isExpanded && (
                  <View style={styles.planRowDetail}>
                    {plan.topPriorities?.length > 0 && (
                      <>
                        <Text style={styles.label}>Priorities</Text>
                        {plan.topPriorities.map((p, i) => (
                          <Text key={i} style={styles.listItem}>• {p}</Text>
                        ))}
                      </>
                    )}
                    {plan.learningGoal ? (
                      <>
                        <Text style={styles.label}>Learning</Text>
                        <Text style={styles.value}>{plan.learningGoal}</Text>
                      </>
                    ) : null}
                    {plan.jobGoal ? (
                      <>
                        <Text style={styles.label}>Job</Text>
                        <Text style={styles.value}>{plan.jobGoal}</Text>
                      </>
                    ) : null}
                    {plan.socialGoal ? (
                      <>
                        <Text style={styles.label}>Social</Text>
                        <Text style={styles.value}>{plan.socialGoal}</Text>
                      </>
                    ) : null}
                  </View>
                )}
              </Pressable>
            );
          })}
        </Card>
      )}

      <Card title={`Plan for ${formatFriendlyDate(planDate)}`}>
        <FormField label="Agenda">
          <TextInput
            value={agenda}
            onChangeText={setAgenda}
            style={[styles.input, styles.textArea]}
            placeholder="Keep the day light and focused"
            multiline
          />
        </FormField>

        <FormField label="Top priorities (one per line)">
          <TextInput
            value={topPrioritiesText}
            onChangeText={setTopPrioritiesText}
            style={[styles.input, styles.textArea]}
            placeholder={'Finish coursework\nApply to one role\nGo for a walk'}
            multiline
          />
        </FormField>

        <FormField label="Learning goal">
          <TextInput
            value={learningGoal}
            onChangeText={setLearningGoal}
            style={styles.input}
            placeholder="Review service layer design"
          />
        </FormField>

        <FormField label="Job goal">
          <TextInput
            value={jobGoal}
            onChangeText={setJobGoal}
            style={styles.input}
            placeholder="Refine one CV bullet"
          />
        </FormField>

        <FormField label="Social goal">
          <TextInput
            value={socialGoal}
            onChangeText={setSocialGoal}
            style={styles.input}
            placeholder="Send one small message"
          />
        </FormField>

        <Pressable
          style={styles.primaryButton}
          onPress={submitPlan}
          disabled={submittingPlan}
        >
          <Text style={styles.primaryButtonText}>
            {submittingPlan ? 'Saving...' : 'Save plan'}
          </Text>
        </Pressable>
      </Card>
    </>
  );

  const renderCheckinForm = () => (
    <Card title="Create check-in">
      <Pressable
        style={styles.primaryButton}
        onPress={submitCheckin}
        disabled={submittingCheckin}
      >
        <Text style={styles.primaryButtonText}>
          {submittingCheckin ? 'Saving...' : 'Save check-in'}
        </Text>
      </Pressable>

      <FormField label="Voice transcript / rant">
        <TextInput
          value={voiceTranscript}
          onChangeText={setVoiceTranscript}
          style={[styles.input, styles.largeTextArea]}
          placeholder="Paste or dictate your rant here..."
          multiline
          autoCorrect
          autoCapitalize="sentences"
        />
      </FormField>

      <Pressable
        style={styles.secondaryButton}
        onPress={pasteTranscriptFromClipboard}
      >
        <Text style={styles.secondaryButtonText}>Paste from clipboard</Text>
      </Pressable>

      <Pressable
        style={styles.secondaryButton}
        onPress={generateCheckinDraft}
        disabled={generatingDraft || !voiceTranscript.trim()}
      >
        <Text style={styles.secondaryButtonText}>
          {generatingDraft
            ? 'Generating draft...'
            : 'Generate draft from transcript'}
        </Text>
      </Pressable>

      <FormField label="Date">
        <TextInput
          value={checkinDate}
          onChangeText={setCheckinDate}
          style={styles.input}
          placeholder="YYYY-MM-DD"
        />
      </FormField>

      <FormField label="Completed (one per line)">
        <TextInput
          value={completedText}
          onChangeText={setCompletedText}
          style={[styles.input, styles.textArea]}
          multiline
        />
      </FormField>

      <FormField label="Incomplete (one per line)">
        <TextInput
          value={incompleteText}
          onChangeText={setIncompleteText}
          style={[styles.input, styles.textArea]}
          multiline
        />
      </FormField>

      <FormField label="Blockers (one per line)">
        <TextInput
          value={blockersText}
          onChangeText={setBlockersText}
          style={[styles.input, styles.textArea]}
          multiline
        />
      </FormField>

      <FormField label="Learned">
        <TextInput
          value={learnedText}
          onChangeText={setLearnedText}
          style={[styles.input, styles.textArea]}
          multiline
        />
      </FormField>

      <FormField label="Small win">
        <TextInput
          value={smallWinText}
          onChangeText={setSmallWinText}
          style={styles.input}
        />
      </FormField>

      <FormField label="Mood">
        <TextInput
          value={mood}
          onChangeText={setMood}
          style={styles.input}
          placeholder="good | steady | low | overwhelmed"
        />
      </FormField>

      <FormField label="Notes">
        <TextInput
          value={notes}
          onChangeText={setNotes}
          style={[styles.input, styles.textArea]}
          multiline
        />
      </FormField>

      <Pressable
        style={styles.primaryButton}
        onPress={submitCheckin}
        disabled={submittingCheckin}
      >
        <Text style={styles.primaryButtonText}>
          {submittingCheckin ? 'Saving...' : 'Save check-in'}
        </Text>
      </Pressable>
    </Card>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text style={styles.helperText}>Loading DayPilot...</Text>
      </SafeAreaView>
    );
  }

  if (error && !brief) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.errorContainer}>
          <Text style={styles.errorText}>Could not load daily brief</Text>
          <Text style={styles.helperText}>{getErrorDisplayText(error)}</Text>

          {error.extra ? (
            <>
              <Text style={styles.debugTitle}>Context</Text>
              <Text selectable style={styles.debugText}>
                {JSON.stringify(error.extra, null, 2)}
              </Text>
            </>
          ) : null}

          {error.cause ? (
            <>
              <Text style={styles.debugTitle}>Cause</Text>
              <Text selectable style={styles.debugText}>
                {error.cause}
              </Text>
            </>
          ) : null}

          {__DEV__ && error.stack ? (
            <>
              <Text style={styles.debugTitle}>Stack trace</Text>
              <Text selectable style={styles.stackText}>
                {error.stack}
              </Text>
            </>
          ) : null}

          <Pressable
            style={styles.secondaryButton}
            onPress={() => loadBrief(selectedDate)}
          >
            <Text style={styles.secondaryButtonText}>Retry</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={20}
      >
        <View style={styles.header}>
          <Text style={styles.title}>DayPilot</Text>
          <View style={styles.dateNav}>
            <Pressable style={styles.dateNavButton} onPress={goToPreviousDay}>
              <Text style={styles.dateNavArrow}>‹</Text>
            </Pressable>
            <Pressable onPress={goToToday}>
              <Text style={styles.dateLabel}>{formatFriendlyDate(selectedDate)}</Text>
            </Pressable>
            <Pressable style={styles.dateNavButton} onPress={goToNextDay}>
              <Text style={styles.dateNavArrow}>›</Text>
            </Pressable>
          </View>
        </View>

        {error ? (
          <Text style={styles.inlineError}>{getErrorDisplayText(error)}</Text>
        ) : null}

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {screen === 'today' && renderBrief()}
          {screen === 'tasks' && renderTasks()}
          {screen === 'plan' && renderPlanForm()}
          {screen === 'log' && renderCheckinForm()}
        </ScrollView>

        <View style={styles.tabBar}>
          <TabItem label="Today" id="today" screen={screen} onPress={setScreen} />
          <TabItem label="Tasks" id="tasks" screen={screen} onPress={setScreen} />
          <TabItem label="Plan" id="plan" screen={screen} onPress={setScreen} />
          <TabItem label="Log" id="log" screen={screen} onPress={setScreen} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Card({ title, children, style }) {
  return (
    <View style={[styles.card, style]}>
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
    </View>
  );
}

function FormField({ label, children }) {
  return (
    <View style={styles.formField}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

function NavButton({ label, active, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.navButton, active && styles.navButtonActive]}
    >
      <Text
        style={[styles.navButtonText, active && styles.navButtonTextActive]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function TabItem({ label, id, screen, onPress }) {
  const active = screen === id;
  return (
    <Pressable style={styles.tabItem} onPress={() => onPress(id)}>
      <Text style={[styles.tabItemText, active && styles.tabItemTextActive]}>
        {label}
      </Text>
      {active && <View style={styles.tabItemDot} />}
    </Pressable>
  );
}

function StatChip({ label, value }) {
  return (
    <View style={styles.statChip}>
      <Text style={styles.statChipLabel}>{label}</Text>
      <Text style={styles.statChipValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f7fb',
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: '#f6f7fb',
    borderBottomWidth: 1,
    borderBottomColor: '#ebebef',
  },
  dateNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateNavButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e9e9ee',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateNavArrow: {
    fontSize: 20,
    color: '#333',
    lineHeight: 24,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    minWidth: 90,
    textAlign: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#ebebef',
    backgroundColor: '#fff',
    paddingBottom: Platform.OS === 'ios' ? 0 : 4,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    gap: 4,
  },
  tabItemText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#999',
  },
  tabItemTextActive: {
    color: '#111',
    fontWeight: '700',
  },
  tabItemDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#111',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
    gap: 12,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorContainer: {
    padding: 24,
    flexGrow: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  navRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8, // slightly tighter grouping
    flexWrap: 'wrap',
  },
  navButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: '#e9e9ee',
  },
  navButtonActive: {
    backgroundColor: '#111',
  },
  navButtonText: {
    color: '#333',
    fontWeight: '600',
  },
  navButtonTextActive: {
    color: '#fff',
  },
  card: {
    backgroundColor: '#f8f9fb',
    borderRadius: 16,
    padding: 14, // was 16
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  todayCard: {
    backgroundColor: 'white',
    shadowOpacity: 0.06,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  focusText: {
    fontSize: 16,
    lineHeight: 24,
  },
  formField: {
    marginBottom: 10,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555', // instead of default black
    marginTop: 8,
    marginBottom: 4,
  },
  value: {
    fontSize: 15,
    lineHeight: 22,
    color: '#222',
  },
  listItem: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 4,
    color: '#222',
    textTransform: 'capitalize',
  },
  compactList: {
    marginTop: 8,
  },
  muted: {
    fontSize: 14,
    color: '#777',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
    fontSize: 15,
  },
  textArea: {
    minHeight: 64,
    textAlignVertical: 'top',
  },
  largeTextArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  primaryButton: {
    marginTop: 10,
    backgroundColor: '#111',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  secondaryButton: {
    marginTop: 8,
    backgroundColor: '#e9e9ee',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#111',
    fontWeight: '700',
    fontSize: 15,
  },
  helperText: {
    marginTop: 8,
    color: '#666',
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 22,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#b00020',
  },
  inlineError: {
    color: '#b00020',
    fontSize: 14,
    marginBottom: 4,
  },
  debugTitle: {
    marginTop: 20,
    marginBottom: 8,
    fontSize: 15,
    fontWeight: '700',
    color: '#111',
  },
  debugText: {
    fontSize: 12,
    lineHeight: 18,
    color: '#333',
  },
  stackText: {
    fontSize: 12,
    lineHeight: 18,
    color: '#333',
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: 'monospace',
    }),
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  taskText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: '#222',
  },
  completedTaskText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: '#777',
    textDecorationLine: 'line-through',
  },
  taskActionButton: {
    backgroundColor: '#111',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  taskActionButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  taskUndoButton: {
    backgroundColor: '#e9e9ee',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  taskUndoButtonText: {
    color: '#111',
    fontWeight: '700',
    fontSize: 13,
  },
  taskTextBlock: {
    flex: 1,
  },
  taskMeta: {
    fontSize: 12,
    color: '#777',
    marginTop: 2,
  },
  dateControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 10,
  },
  dateChip: {
    flex: 1,
    backgroundColor: '#e9e9ee',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  dateChipText: {
    color: '#111',
    fontWeight: '600',
    fontSize: 13,
  },
  statChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
    marginBottom: 8,
  },
  statChip: {
    backgroundColor: '#f1f3f7',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  statChipLabel: {
    fontSize: 12,
    color: '#666',
  },
  statChipValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
  },
  inlineToggle: {
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  inlineToggleText: {
    color: '#4f46e5',
    fontSize: 14,
    fontWeight: '600',
  },
  expandedSection: {
    marginTop: 8,
    marginBottom: 16,
  },
  dateToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6, // was 2 or 4
  },

  dateToolbarInput: {
    flex: 1,
    minWidth: 110,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
    fontSize: 15,
  },

  dateToolbarButton: {
    backgroundColor: '#e9e9ee',
    paddingHorizontal: 11,
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  debugItem: {
    marginBottom: 14,
  },

  debugItemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#222',
  },

  debugItemMeta: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
    textTransform: 'uppercase',
  },

  section: {
    marginBottom: 16,
  },

  meta: {
    color: '#888',
    fontSize: 13,
  },

  severityHigh: { color: '#222' },
  severityMedium: { color: '#555' },
  severityLow: { color: '#888' },

  tabDateLabel: {
    paddingHorizontal: 4,
    paddingBottom: 4,
  },
  tabDateLabelText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
  },
  tabDateLabelHint: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  planRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  planRowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  planRowDate: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111',
    minWidth: 90,
  },
  planRowAgenda: {
    flex: 1,
    fontSize: 13,
    color: '#666',
  },
  planRowChevron: {
    fontSize: 12,
    color: '#999',
  },
  planRowDetail: {
    marginTop: 8,
    paddingLeft: 4,
  },
  nudge: {
    backgroundColor: '#fff3cd',
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },

  nudgeText: {
    fontSize: 13,
    color: '#444',
  },

  analysisControls: {
  flexDirection: 'row',
  gap: 8,
  marginBottom: 10,
},

analysisChip: {
  backgroundColor: '#e9e9ee',
  paddingHorizontal: 12,
  paddingVertical: 8,
  borderRadius: 999,
},

analysisChipActive: {
  backgroundColor: '#111',
},

analysisChipText: {
  color: '#333',
  fontWeight: '600',
},

analysisChipTextActive: {
  color: '#fff',
},
});
