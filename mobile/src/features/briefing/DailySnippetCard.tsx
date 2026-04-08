import React from 'react';
import { View, Text, Pressable, Linking, StyleSheet } from 'react-native';
import type { DailySnippet, SnippetItem } from '../../api/briefing';

type Props = {
  snippet: DailySnippet;
};

const SECTION_COLORS: Record<string, string> = {
  Learn: '#10b981',
  Pulse: '#3b82f6',
  Tools: '#f59e0b',
};

const TOPIC_COLORS = [
  '#ede9fe', '#dbeafe', '#d1fae5', '#fef3c7', '#fce7f3', '#e0f2fe',
];

function SectionLink({ item, color }: { item: SnippetItem; color: string }) {
  return (
    <Pressable style={styles.linkRow} onPress={() => Linking.openURL(item.url)}>
      <View style={[styles.linkAccent, { backgroundColor: color }]} />
      <View style={styles.linkContent}>
        <Text style={styles.linkTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.linkMeta}>
          {item.source} · {item.relevance_note}
        </Text>
      </View>
    </Pressable>
  );
}

function Section({ title, items }: { title: string; items: SnippetItem[] }) {
  if (!items.length) return null;
  const color = SECTION_COLORS[title] ?? '#94a3b8';
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={[styles.sectionDot, { backgroundColor: color }]} />
        <Text style={[styles.sectionTitle, { color }]}>{title}</Text>
      </View>
      {items.map((item, i) => (
        <SectionLink key={`${item.url}-${i}`} item={item} color={color} />
      ))}
    </View>
  );
}

export function DailySnippetCard({ snippet }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.heading}>Your daily briefing</Text>
      {snippet.topics.length > 0 && (
        <View style={styles.topicsRow}>
          {snippet.topics.slice(0, 6).map((t, i) => (
            <View key={t} style={[styles.topic, { backgroundColor: TOPIC_COLORS[i % TOPIC_COLORS.length] }]}>
              <Text style={styles.topicText}>{t}</Text>
            </View>
          ))}
        </View>
      )}
      <Section title="Learn" items={snippet.learn} />
      <Section title="Pulse" items={snippet.pulse} />
      <Section title="Tools" items={snippet.tools} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  heading: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#111',
  },
  topicsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  topic: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  topicText: {
    fontSize: 11,
    color: '#374151',
    fontWeight: '500',
  },
  section: {
    marginBottom: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  sectionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  linkRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  linkAccent: {
    width: 3,
    borderRadius: 2,
    marginTop: 3,
    alignSelf: 'stretch',
    minHeight: 16,
  },
  linkContent: {
    flex: 1,
  },
  linkTitle: {
    fontSize: 14,
    color: '#1a1a1a',
    lineHeight: 20,
  },
  linkMeta: {
    fontSize: 11,
    color: '#888',
    marginTop: 1,
  },
});
