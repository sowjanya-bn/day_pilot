import React from 'react';
import { View, Text, Pressable, Linking, StyleSheet } from 'react-native';
import type { DailySnippet, SnippetItem } from '../../api/briefing';

type Props = {
  snippet: DailySnippet;
};

function SectionLink({ item }: { item: SnippetItem }) {
  return (
    <Pressable style={styles.linkRow} onPress={() => Linking.openURL(item.url)}>
      <Text style={styles.linkTitle} numberOfLines={2}>
        {item.title}
      </Text>
      <Text style={styles.linkMeta}>
        {item.source} · {item.relevance_note}
      </Text>
    </Pressable>
  );
}

function Section({ title, items }: { title: string; items: SnippetItem[] }) {
  if (!items.length) return null;
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {items.map((item, i) => (
        <SectionLink key={`${item.url}-${i}`} item={item} />
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
          {snippet.topics.slice(0, 6).map((t) => (
            <View key={t} style={styles.topic}>
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
    marginBottom: 12,
  },
  topic: {
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  topicText: {
    fontSize: 11,
    color: '#555',
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  linkRow: {
    marginBottom: 8,
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
