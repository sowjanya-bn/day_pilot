import React, { useMemo, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

const TABS = ['Plan Tomorrow', 'Check In', 'Ideas'];

function Card({ title, children }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
    </View>
  );
}

function PillTabs({ activeTab, onChange }) {
  return (
    <View style={styles.tabRow}>
      {TABS.map((tab) => {
        const active = activeTab === tab;
        return (
          <TouchableOpacity
            key={tab}
            onPress={() => onChange(tab)}
            style={[styles.tab, active && styles.tabActive]}
          >
            <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState('Plan Tomorrow');
  const [agenda, setAgenda] = useState('');
  const [priorities, setPriorities] = useState('');
  const [learningGoal, setLearningGoal] = useState('');
  const [socialGoal, setSocialGoal] = useState('');

  const [completed, setCompleted] = useState('');
  const [incomplete, setIncomplete] = useState('');
  const [blockers, setBlockers] = useState('');
  const [carryForward, setCarryForward] = useState('');
  const [notes, setNotes] = useState('');

  const starterIdeas = useMemo(
    () => [
      'Learning: pull next coursework step and attach one useful link',
      'Jobs: fetch recent roles from saved keywords',
      'Social: suggest one small reach-out action',
      'Notifications: morning reminder and evening check-in buzz',
    ],
    []
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>AchieveMate</Text>
        <Text style={styles.subtitle}>A gentle, goal-oriented companion</Text>

        <PillTabs activeTab={activeTab} onChange={setActiveTab} />

        {activeTab === 'Plan Tomorrow' && (
          <Card title="Tomorrow Planner">
            <Text style={styles.label}>Agenda</Text>
            <TextInput
              style={styles.input}
              placeholder="What needs to happen tomorrow?"
              value={agenda}
              onChangeText={setAgenda}
            />

            <Text style={styles.label}>Top priorities</Text>
            <TextInput
              style={styles.input}
              placeholder="Comma-separated priorities"
              value={priorities}
              onChangeText={setPriorities}
            />

            <Text style={styles.label}>Learning goal</Text>
            <TextInput
              style={styles.input}
              placeholder="What do you want to learn next?"
              value={learningGoal}
              onChangeText={setLearningGoal}
            />

            <Text style={styles.label}>Social goal</Text>
            <TextInput
              style={styles.input}
              placeholder="One gentle social action"
              value={socialGoal}
              onChangeText={setSocialGoal}
            />

            <TouchableOpacity style={styles.button}>
              <Text style={styles.buttonText}>Save plan</Text>
            </TouchableOpacity>
          </Card>
        )}

        {activeTab === 'Check In' && (
          <Card title="End-of-day Check-in">
            <Text style={styles.label}>Completed</Text>
            <TextInput style={styles.input} value={completed} onChangeText={setCompleted} placeholder="What got done?" />

            <Text style={styles.label}>Incomplete</Text>
            <TextInput style={styles.input} value={incomplete} onChangeText={setIncomplete} placeholder="What did not get done?" />

            <Text style={styles.label}>Blockers</Text>
            <TextInput style={styles.input} value={blockers} onChangeText={setBlockers} placeholder="What got in the way?" />

            <Text style={styles.label}>Carry forward</Text>
            <TextInput style={styles.input} value={carryForward} onChangeText={setCarryForward} placeholder="What should move to tomorrow?" />

            <Text style={styles.label}>Notes</Text>
            <TextInput style={[styles.input, styles.textArea]} multiline value={notes} onChangeText={setNotes} placeholder="Any quick reflection?" />

            <TouchableOpacity style={styles.button}>
              <Text style={styles.buttonText}>Save check-in</Text>
            </TouchableOpacity>
          </Card>
        )}

        {activeTab === 'Ideas' && (
          <Card title="Next modules">
            {starterIdeas.map((idea) => (
              <View key={idea} style={styles.ideaRow}>
                <Text style={styles.ideaBullet}>•</Text>
                <Text style={styles.ideaText}>{idea}</Text>
              </View>
            ))}
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7f7',
  },
  content: {
    padding: 20,
    gap: 16,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    marginTop: 12,
  },
  subtitle: {
    fontSize: 15,
    color: '#555',
    marginBottom: 8,
  },
  tabRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tab: {
    backgroundColor: '#e8e8e8',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
  },
  tabActive: {
    backgroundColor: '#222',
  },
  tabText: {
    color: '#333',
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#fff',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    gap: 10,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 6,
  },
  input: {
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  button: {
    marginTop: 10,
    backgroundColor: '#222',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
  },
  ideaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  ideaBullet: {
    fontSize: 18,
    lineHeight: 22,
  },
  ideaText: {
    flex: 1,
    color: '#333',
    lineHeight: 22,
  },
});
