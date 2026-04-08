import React from "react";
import { View, Text, Pressable, Linking } from "react-native";
import type { ContextTodayResponse } from "../../api/context";

type Props = {
  briefing: ContextTodayResponse;
  condensed?: boolean;
};

export function DailyBriefingCard({ briefing, condensed = false }: Props) {
  const focus = briefing.focus.slice(0, condensed ? 1 : 2);
  const outstanding = condensed ? [] : briefing.outstanding.slice(0, 1);
  const news = condensed ? [] : briefing.news.slice(0, 1);

  return (
    <View
      style={{
        marginHorizontal: 16,
        marginTop: 12,
        padding: 16,
        borderRadius: 16,
        backgroundColor: "white",
        borderWidth: 1,
        borderColor: "#E8E8E8",
      }}
    >
      <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 6 }}>
        Good day
      </Text>

      <Text style={{ fontSize: 14, lineHeight: 20, color: "#333", marginBottom: 12 }}>
        {briefing.summary_line}
      </Text>

      {focus.length > 0 && (
        <View style={{ marginBottom: 10 }}>
          <Text style={{ fontSize: 13, fontWeight: "600", marginBottom: 6 }}>Focus</Text>
          {focus.map((item) => (
            <View key={item.task_id} style={{ marginBottom: 6 }}>
              <Text style={{ fontSize: 14, color: "#111" }}>{item.title}</Text>
              {!condensed && (
                <Text style={{ fontSize: 12, color: "#666" }}>{item.reason}</Text>
              )}
            </View>
          ))}
        </View>
      )}

      {outstanding.length > 0 && (
        <View style={{ marginBottom: 10 }}>
          <Text style={{ fontSize: 13, fontWeight: "600", marginBottom: 6 }}>
            Outstanding
          </Text>
          {outstanding.map((item) => (
            <View key={item.task_id}>
              <Text style={{ fontSize: 14, color: "#111" }}>{item.title}</Text>
              <Text style={{ fontSize: 12, color: "#666" }}>{item.note}</Text>
            </View>
          ))}
        </View>
      )}

      {news.length > 0 && (
        <View style={{ marginBottom: 10 }}>
          <Text style={{ fontSize: 13, fontWeight: "600", marginBottom: 6 }}>
            In the wild
          </Text>
          {news.map((item, index) => (
            <Pressable key={`${item.url}-${index}`} onPress={() => Linking.openURL(item.url)}>
              <Text style={{ fontSize: 14, color: "#111" }}>{item.title}</Text>
              <Text style={{ fontSize: 12, color: "#666" }}>
                {item.source} · {item.relevance_note}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {!condensed && briefing.nudge ? (
        <Text style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
          {briefing.nudge}
        </Text>
      ) : null}
    </View>
  );
}