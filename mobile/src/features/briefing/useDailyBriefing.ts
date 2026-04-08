import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ContextTodayResponse, InputTask } from "../../api/context";
import { fetchTodayContext } from "../../api/context";

const LAST_BRIEFED_KEY = "daypilot:lastBriefedDate";

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function useDailyBriefing(tasks: InputTask[]) {
  const [briefing, setBriefing] = useState<ContextTodayResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [shouldShowFullCard, setShouldShowFullCard] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const today = todayIsoDate();
        const lastBriefed = await AsyncStorage.getItem(LAST_BRIEFED_KEY);

        const res = await fetchTodayContext(tasks);
        if (cancelled) return;

        setBriefing(res);
        setShouldShowFullCard(lastBriefed !== today);

        if (lastBriefed !== today) {
          await AsyncStorage.setItem(LAST_BRIEFED_KEY, today);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to load daily briefing", err);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [JSON.stringify(tasks)]);

  return {
    briefing,
    loading,
    shouldShowFullCard,
  };
}