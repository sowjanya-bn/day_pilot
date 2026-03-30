import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from "react-native";

const API_BASE_URL = "http://localhost:8000/api";
const DEFAULT_DATE = "2026-03-30";

export default function App() {
  const [brief, setBrief] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDailyBrief = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_BASE_URL}/daily-brief/${DEFAULT_DATE}`
        );

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

    loadDailyBrief();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text style={styles.helperText}>Loading DayPilot...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.errorText}>Could not load daily brief</Text>
        <Text style={styles.helperText}>{error}</Text>
      </SafeAreaView>
    );
  }

  const { guidance, stats, plan, yesterday_reflection } = brief;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>DayPilot</Text>
        <Text style={styles.subtitle}>Your daily brief</Text>

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
          <Text style={styles.value}>{yesterday_reflection?.learned || "—"}</Text>

          <Text style={styles.label}>Small win</Text>
          <Text style={styles.value}>{yesterday_reflection?.small_win || "—"}</Text>

          <Text style={styles.label}>Notes</Text>
          <Text style={styles.value}>{yesterday_reflection?.notes || "—"}</Text>
        </Card>
      </ScrollView>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f6f7fb",
  },
  content: {
    padding: 20,
    paddingBottom: 40,
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
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 10,
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
});