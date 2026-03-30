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

export default function App() {
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

  const loadBrief = async (day = selectedDate) => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_BASE_URL}/daily-brief/${day}`);

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
      }

      const data = await response.json();
      setBrief(data);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBrief(DEFAULT_DATE);
  }, []);

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

  const renderBrief = () => {
    const { guidance, stats, plan, yesterday_reflection } = brief || {};

    return (
      <>
        <Card title="Focus">
          <Text style={styles.focusText}>{guidance?.focus_message}</Text>
        </Card>

        <Card title="Carry-forward tasks">
          {guidance?.carry_forward_tasks?.length ? (
            guidance.carry_forward_tasks.map((task, index) => (
              <Text key={index} style={styles.listItem}>
                • {task}
              </Text>
            ))
          ) : (
            <Text style={styles.muted}>No carry-forward tasks</Text>
          )}
        </Card>

        <Card title="Guidance">
          <Text style={styles.label}>Learning</Text>
          <Text style={styles.value}>
            {guidance?.suggested_learning_next_step || "—"}
          </Text>

          <Text style={styles.label}>Job</Text>
          <Text style={styles.value}>
            {guidance?.suggested_job_nudge || "—"}
          </Text>

          <Text style={styles.label}>Social</Text>
          <Text style={styles.value}>
            {guidance?.suggested_social_nudge || "—"}
          </Text>
        </Card>

        <Card title="Stats">
          <Text style={styles.value}>
            Planning streak: {stats?.planning_streak ?? 0}
          </Text>
          <Text style={styles.value}>
            Check-in streak: {stats?.checkin_streak ?? 0}
          </Text>
          <Text style={styles.value}>
            Completed in last 7 days: {stats?.completed_tasks_last_7_days ?? 0}
          </Text>
          <Text style={styles.value}>
            Incomplete in last 7 days: {stats?.incomplete_tasks_last_7_days ?? 0}
          </Text>
        </Card>

        <Card title="Today's plan">
          <Text style={styles.label}>Agenda</Text>
          <Text style={styles.value}>{plan?.agenda || "—"}</Text>

          <Text style={styles.label}>Top priorities</Text>
          {plan?.top_priorities?.length ? (
            plan.top_priorities.map((item, index) => (
              <Text key={index} style={styles.listItem}>
                • {item}
              </Text>
            ))
          ) : (
            <Text style={styles.muted}>No priorities set</Text>
          )}

          <Text style={styles.label}>Learning goal</Text>
          <Text style={styles.value}>{plan?.learning_goal || "—"}</Text>

          <Text style={styles.label}>Job goal</Text>
          <Text style={styles.value}>{plan?.job_goal || "—"}</Text>

          <Text style={styles.label}>Social goal</Text>
          <Text style={styles.value}>{plan?.social_goal || "—"}</Text>
        </Card>

        <Card title="Yesterday's reflection">
          <Text style={styles.label}>Mood</Text>
          <Text style={styles.value}>{yesterday_reflection?.mood || "—"}</Text>

          <Text style={styles.label}>Completed</Text>
          {yesterday_reflection?.completed?.length ? (
            yesterday_reflection.completed.map((item, index) => (
              <Text key={index} style={styles.listItem}>
                • {item}
              </Text>
            ))
          ) : (
            <Text style={styles.muted}>No completed tasks</Text>
          )}

          <Text style={styles.label}>Incomplete</Text>
          {yesterday_reflection?.incomplete?.length ? (
            yesterday_reflection.incomplete.map((item, index) => (
              <Text key={index} style={styles.listItem}>
                • {item}
              </Text>
            ))
          ) : (
            <Text style={styles.muted}>No incomplete tasks</Text>
          )}

          <Text style={styles.label}>Learned</Text>
          <Text style={styles.value}>
            {yesterday_reflection?.learned || "—"}
          </Text>

          <Text style={styles.label}>Small win</Text>
          <Text style={styles.value}>
            {yesterday_reflection?.small_win || "—"}
          </Text>

          <Text style={styles.label}>Notes</Text>
          <Text style={styles.value}>{yesterday_reflection?.notes || "—"}</Text>
        </Card>
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
          </View>

          {error ? <Text style={styles.inlineError}>{error}</Text> : null}

          {screen === "brief" && renderBrief()}
          {screen === "plan" && renderPlanForm()}
          {screen === "checkin" && renderCheckinForm()}

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
  primaryButton: {
    marginTop: 8,
    backgroundColor: "#111",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  secondaryButton: {
    marginTop: 4,
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
});