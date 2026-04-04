import React, { useEffect, useState } from "react";
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
} from "react-native";
import * as Clipboard from "expo-clipboard";

import { getDailyBriefLocal } from "./src/local/brief/getDailyBriefLocal.ts";
//import { mockRepository } from "./src/local/storage/mockRepository.ts";
import { sqliteRepository } from "./src/local/storage/sqliteRepository";
import { mapLocalBriefToUiShape } from "./src/local/brief/mapLocalBriefToUiShape.ts";

import { initDb, seedDb } from "./src/local/storage/sqlite.ts";



const API_BASE_URL = "http://localhost:8000/api";
const DEFAULT_DATE = "2026-03-30";

async function apiPost(path, payload) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
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
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
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
  const d = new Date(`${isoDate}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function App() {
  const USE_LOCAL_BRIEF = true;
  const [brief, setBrief] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [screen, setScreen] = useState("brief");

  const [selectedDate, setSelectedDate] = useState(DEFAULT_DATE);

  const [planDate, setPlanDate] = useState(DEFAULT_DATE);
  const [agenda, setAgenda] = useState("");
  const [topPrioritiesText, setTopPrioritiesText] = useState("");
  const [learningGoal, setLearningGoal] = useState("");
  const [jobGoal, setJobGoal] = useState("");
  const [socialGoal, setSocialGoal] = useState("");
  const [submittingPlan, setSubmittingPlan] = useState(false);

  const [checkinDate, setCheckinDate] = useState(DEFAULT_DATE);
  const [completedText, setCompletedText] = useState("");
  const [incompleteText, setIncompleteText] = useState("");
  const [blockersText, setBlockersText] = useState("");
  const [learnedText, setLearnedText] = useState("");
  const [smallWinText, setSmallWinText] = useState("");
  const [mood, setMood] = useState("steady");
  const [notes, setNotes] = useState("");
  const [submittingCheckin, setSubmittingCheckin] = useState(false);

  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [generatingDraft, setGeneratingDraft] = useState(false);

  const [newTask, setNewTask] = useState("");
  const [expanded, setExpanded] = useState(false)

  const loadBrief = async (day = selectedDate) => {
    try {
      setLoading(true);
      setError("");

      if (USE_LOCAL_BRIEF) {
          console.log("=== DAILY BRIEF ===");
          const localBrief = await getDailyBriefLocal(day, sqliteRepository);
          const uiBrief = mapLocalBriefToUiShape(localBrief);
          setBrief(uiBrief);

      } else {
          const response = await fetch(`${API_BASE_URL}/daily-brief/${day}`);
          if (!response.ok) {
            throw new Error(`Request failed: ${response.status}`);
          }

          const data = await response.json();
          setBrief(data);

      }


    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function setup() {
      try {
        await initDb();
        await seedDb();
        console.log("DB initialized");
      } catch (e) {
        console.error("DB init failed", e);
      }
    }

    setup();
  }, []);

  useEffect(() => {
    loadBrief(DEFAULT_DATE);
  }, []);

  useEffect(() => {
    setPlanDate(selectedDate);
    setCheckinDate(selectedDate);
  }, [selectedDate]);

  const pasteTranscriptFromClipboard = async () => {
    try {
      const text = await Clipboard.getStringAsync();
      if (text) {
        setVoiceTranscript(text);
      }
    } catch {
      setError("Could not paste transcript from clipboard");
    }
  };

  const handleDateChange = (newDate) => {
    setSelectedDate(newDate);
  };

  const loadSelectedDate = async () => {
    await loadBrief(selectedDate);
  };

  const goToPreviousDay = async () => {
    const newDate = shiftDate(selectedDate, -1);
    setSelectedDate(newDate);
    await loadBrief(newDate);
  };

  const goToNextDay = async () => {
    const newDate = shiftDate(selectedDate, 1);
    setSelectedDate(newDate);
    await loadBrief(newDate);
  };

  const generateCheckinDraft = async () => {
    try {
      setGeneratingDraft(true);
      setError("");

      const payload = {
        date: checkinDate,
        transcript: voiceTranscript,
      };

      const draft = await apiPost("/checkin/voice-draft", payload);

      setCompletedText((draft.completed || []).join("\n"));
      setIncompleteText((draft.incomplete || []).join("\n"));
      setBlockersText((draft.blockers || []).join("\n"));
      setLearnedText(draft.learned || "");
      setSmallWinText(draft.small_win || "");
      setMood(draft.mood || "steady");
      setNotes(draft.notes || "");
    } catch (err) {
      setError(err.message || "Could not generate check-in draft");
    } finally {
      setGeneratingDraft(false);
    }
  };

  const addTask = async () => {
    try {
      if (!newTask.trim()) return;

      await apiPost("/tasks", {
        date: selectedDate,
        title: newTask,
        category: "general",
        source: "manual",
      });

      setNewTask("");
      await loadBrief(selectedDate);
    } catch (err) {
      setError(err.message || "Could not add task");
    }
  };

  const toggleTaskStatus = async (taskId, nextStatus) => {
    try {
      setError("");

      await apiPut(`/tasks/${taskId}/status`, {
        status: nextStatus,
      });

      await loadBrief(selectedDate);
    } catch (err) {
      setError(err.message || "Could not update task");
    }
  };

  const submitPlan = async () => {
    try {
      setSubmittingPlan(true);
      setError("");

      const payload = {
        date: planDate,
        agenda: agenda || null,
        top_priorities: topPrioritiesText
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean),
        learning_goal: learningGoal || null,
        job_goal: jobGoal || null,
        social_goal: socialGoal || null,
      };

      await apiPost("/planner", payload);
      setSelectedDate(planDate);
      await loadBrief(planDate);
      setScreen("brief");
    } catch (err) {
      setError(err.message || "Could not create plan");
    } finally {
      setSubmittingPlan(false);
    }
  };

  const submitCheckin = async () => {
    try {
      setSubmittingCheckin(true);
      setError("");

      const completed = completedText
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean);

      const incomplete = incompleteText
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean);

      const blockers = blockersText
        .split("\n")
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
        mood: mood || "steady",
        notes: notes || null,
      };

      await apiPost("/checkin", payload);
      setSelectedDate(checkinDate);
      await loadBrief(checkinDate);
      setScreen("brief");
    } catch (err) {
      setError(err.message || "Could not create check-in");
    } finally {
      setSubmittingCheckin(false);
    }
  };

  const renderTasks = () => {
    const { tasks } = brief || {};

    return (
      <>
        <Card title="Date">
          <TextInput
            value={selectedDate}
            onChangeText={handleDateChange}
            onSubmitEditing={loadSelectedDate}
            style={styles.input}
            placeholder="YYYY-MM-DD"
          />

          <View style={styles.dateControls}>
            <Pressable style={styles.dateChip} onPress={goToPreviousDay}>
              <Text style={styles.dateChipText}>← Previous</Text>
            </Pressable>

            <Pressable
              style={styles.dateChip}
              onPress={() => {
                setSelectedDate(new Date().toISOString().slice(0, 10));
                loadBrief(new Date().toISOString().slice(0, 10));
              }}
            >
              <Text style={styles.dateChipText}>Today</Text>
            </Pressable>

            <Pressable style={styles.dateChip} onPress={goToNextDay}>
              <Text style={styles.dateChipText}>Next →</Text>
            </Pressable>
          </View>

          <Pressable style={styles.secondaryButton} onPress={loadSelectedDate}>
            <Text style={styles.secondaryButtonText}>Load date</Text>
          </Pressable>
        </Card>

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
          {tasks?.outstanding?.length ? (
            tasks.outstanding.map((task) => (
              <View key={task.id} style={styles.taskRow}>
                <View style={styles.taskTextBlock}>
                  <Text style={styles.taskText}>{task.title}</Text>
                  <Text style={styles.taskMeta}>
                    {task.category} · {task.source}
                  </Text>
                </View>
                <Pressable
                  style={styles.taskActionButton}
                  onPress={() => toggleTaskStatus(task.id, "completed")}
                >
                  <Text style={styles.taskActionButtonText}>Done</Text>
                </Pressable>
              </View>
            ))
          ) : (
            <Text style={styles.muted}>No outstanding tasks</Text>
          )}
        </Card>

        <Card title="Completed today">
          {tasks?.completed?.length ? (
            tasks.completed.map((task) => (
              <View key={task.id} style={styles.taskRow}>
                <View style={styles.taskTextBlock}>
                  <Text style={styles.completedTaskText}>{task.title}</Text>
                  <Text style={styles.taskMeta}>
                    {task.category} · {task.source}
                  </Text>
                </View>
                <Pressable
                  style={styles.taskUndoButton}
                  onPress={() => toggleTaskStatus(task.id, "outstanding")}
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
  };

  const renderBrief = () => {
  const { guidance, stats, plan, yesterday_reflection, reflection } = brief || {};

  return (
    <>
      <Card title="Today">
        <Text style={styles.focusText}>{guidance?.focus_message}</Text>

        <View style={styles.statChipsRow}>
          <StatChip label="Plan" value={stats?.planning_streak ?? 0} />
          <StatChip label="Check-in" value={stats?.checkin_streak ?? 0} />
          <StatChip label="Done 7d" value={stats?.completed_tasks_last_7_days ?? 0} />
          <StatChip label="Open 7d" value={stats?.incomplete_tasks_last_7_days ?? 0} />
        </View>

        <Text style={styles.label}>Learning</Text>
        <Text style={styles.value}>{guidance?.suggested_learning_next_step || "—"}</Text>

        <Text style={styles.label}>Job</Text>
        <Text style={styles.value}>{guidance?.suggested_job_nudge || "—"}</Text>

        <Text style={styles.label}>Social</Text>
        <Text style={styles.value}>{guidance?.suggested_social_nudge || "—"}</Text>
      </Card>

      {reflection && (
  <Card title="Reflection">
    {reflection.patterns?.length > 0 && (
      <>
        <Text style={styles.label}>What stood out</Text>
        {reflection.patterns.map((p, i) => (
          <Text key={i} style={styles.listItem}>• {p}</Text>
        ))}
      </>
    )}

    {reflection.insight && (
      <>
        <Text style={styles.label}>What this may mean</Text>
        <Text style={styles.value}>{reflection.insight}</Text>
      </>
    )}

    {reflection.guidance?.length > 0 && (
      <>
        <Text style={styles.label}>Suggested next step</Text>
        {reflection.guidance.map((g, i) => (
          <Text key={i} style={styles.listItem}>• {g}</Text>
        ))}
      </>
    )}
  </Card>
)}

      {!!guidance?.carry_forward_tasks?.length && (
        <Card title="Carry-forward tasks">
          {guidance.carry_forward_tasks.map((task, index) => (
            <Text key={index} style={styles.listItem}>• {task}</Text>
          ))}
        </Card>
      )}
    </>
  );
};

  const renderPlanForm = () => (
    <Card title="Create plan">
      <Pressable
        style={styles.primaryButton}
        onPress={submitPlan}
        disabled={submittingPlan}
      >
        <Text style={styles.primaryButtonText}>
          {submittingPlan ? "Saving..." : "Save plan"}
        </Text>
      </Pressable>

      <FormField label="Date">
        <TextInput
          value={planDate}
          onChangeText={setPlanDate}
          style={styles.input}
          placeholder="YYYY-MM-DD"
        />
      </FormField>

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
          placeholder={"Finish coursework\nApply to one role\nGo for a walk"}
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
          {submittingPlan ? "Saving..." : "Save plan"}
        </Text>
      </Pressable>
    </Card>
  );

  const renderCheckinForm = () => (
    <Card title="Create check-in">
      <Pressable
        style={styles.primaryButton}
        onPress={submitCheckin}
        disabled={submittingCheckin}
      >
        <Text style={styles.primaryButtonText}>
          {submittingCheckin ? "Saving..." : "Save check-in"}
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
          {generatingDraft ? "Generating draft..." : "Generate draft from transcript"}
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
          {submittingCheckin ? "Saving..." : "Save check-in"}
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
      <SafeAreaView style={styles.centered}>
        <Text style={styles.errorText}>Could not load daily brief</Text>
        <Text style={styles.helperText}>{error}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={20}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={true}
        >
          <Text style={styles.title}>DayPilot</Text>
          <Text style={styles.subtitle}>Your daily brief for {selectedDate}</Text>

          <View style={styles.navRow}>
            <NavButton
              label="Brief"
              active={screen === "brief"}
              onPress={() => setScreen("brief")}
            />
            <NavButton
              label="Plan"
              active={screen === "plan"}
              onPress={() => setScreen("plan")}
            />
            <NavButton
              label="Check-in"
              active={screen === "checkin"}
              onPress={() => setScreen("checkin")}
            />
            <NavButton
              label="Tasks"
              active={screen === "tasks"}
              onPress={() => setScreen("tasks")}
            />
          </View>

          {error ? <Text style={styles.inlineError}>{error}</Text> : null}

          {screen === "brief" && renderBrief()}
          {screen === "plan" && renderPlanForm()}
          {screen === "checkin" && renderCheckinForm()}
          {screen === "tasks" && renderTasks()}

          <Pressable
            style={styles.secondaryButton}
            onPress={() => loadBrief(selectedDate)}
          >
            <Text style={styles.secondaryButtonText}>Refresh brief</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Card({ title, children }) {
  return (
    <View style={styles.card}>
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
      <Text style={[styles.navButtonText, active && styles.navButtonTextActive]}>
        {label}
      </Text>
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
    backgroundColor: "#f6f7fb",
  },
  content: {
    padding: 20,
    paddingBottom: 120,
    gap: 16,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 8,
  },
  navRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  navButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: "#e9e9ee",
  },
  navButtonActive: {
    backgroundColor: "#111",
  },
  navButtonText: {
    color: "#333",
    fontWeight: "600",
  },
  navButtonTextActive: {
    color: "#fff",
  },
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  focusText: {
    fontSize: 16,
    lineHeight: 24,
  },
  formField: {
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 6,
    marginBottom: 4,
  },
  value: {
    fontSize: 15,
    lineHeight: 22,
    color: "#222",
  },
  listItem: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 4,
    color: "#222",
  },
  muted: {
    fontSize: 14,
    color: "#777",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
    fontSize: 15,
  },
  textArea: {
    minHeight: 64,
    textAlignVertical: "top",
  },
  largeTextArea: {
    minHeight: 120,
    textAlignVertical: "top",
  },
  primaryButton: {
    marginTop: 10,
    backgroundColor: "#111",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  secondaryButton: {
    marginTop: 8,
    backgroundColor: "#e9e9ee",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#111",
    fontWeight: "700",
    fontSize: 15,
  },
  helperText: {
    marginTop: 8,
    color: "#666",
    textAlign: "center",
  },
  errorText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#b00020",
  },
  inlineError: {
    color: "#b00020",
    fontSize: 14,
    marginBottom: 4,
  },
  taskRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  taskText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: "#222",
  },
  completedTaskText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: "#777",
    textDecorationLine: "line-through",
  },
  taskActionButton: {
    backgroundColor: "#111",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  taskActionButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },
  taskUndoButton: {
    backgroundColor: "#e9e9ee",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  taskUndoButtonText: {
    color: "#111",
    fontWeight: "700",
    fontSize: 13,
  },
  taskTextBlock: {
    flex: 1,
  },
  taskMeta: {
    fontSize: 12,
    color: "#777",
    marginTop: 2,
  },
  dateControls: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    marginTop: 10,
  },
  dateChip: {
    flex: 1,
    backgroundColor: "#e9e9ee",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  dateChipText: {
    color: "#111",
    fontWeight: "600",
    fontSize: 13,
  },
  statChipsRow: {
  flexDirection: "row",
  flexWrap: "wrap",
  gap: 8,
  marginTop: 12,
  marginBottom: 8,
},
statChip: {
  backgroundColor: "#f1f3f7",
  borderRadius: 12,
  paddingVertical: 8,
  paddingHorizontal: 10,
},
statChipLabel: {
  fontSize: 12,
  color: "#666",
},
statChipValue: {
  fontSize: 16,
  fontWeight: "700",
  color: "#111",
},
});