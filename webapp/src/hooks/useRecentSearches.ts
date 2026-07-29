import { useCallback, useEffect, useState } from "react";
import type { TmdbMovie } from "@/types/TmdbMovie.ts";

const MAX_RECENT = 10;

export type RecentEntry =
  | { kind: "query"; label: string }
  | { kind: "tmdb"; label: string; movie: TmdbMovie }
  | { kind: "actor"; label: string; personId: number };

const VALID_KINDS = new Set(["query", "tmdb", "actor"]);

function storageKey(userId: string): string {
  return `recent-searches-${userId}`;
}

function isRecentEntry(v: unknown): v is RecentEntry {
  return typeof v === "object" && v !== null && "kind" in v && "label" in v && VALID_KINDS.has((v as { kind: unknown }).kind as string);
}

function load(userId: string): RecentEntry[] {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((v): RecentEntry | null => {
      if (typeof v === "string") return { kind: "query", label: v };
      return isRecentEntry(v) ? v : null;
    }).filter((v): v is RecentEntry => v !== null);
  } catch {
    return [];
  }
}

function save(userId: string, entries: RecentEntry[]) {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(entries));
  } catch {
    // ignore storage failures
  }
}

export function useRecentSearches(userId: string) {
  const [recent, setRecent] = useState<RecentEntry[]>(() => load(userId));

  useEffect(() => {
    setRecent(load(userId));
  }, [userId]);

  const addRecent = useCallback((entry: RecentEntry) => {
    const label = entry.label.trim();
    if (!label) return;
    setRecent((prev) => {
      const next = [{ ...entry, label }, ...prev.filter((e) => e.label !== label)].slice(0, MAX_RECENT);
      save(userId, next);
      return next;
    });
  }, [userId]);

  const removeRecent = useCallback((label: string) => {
    setRecent((prev) => {
      const next = prev.filter((e) => e.label !== label);
      save(userId, next);
      return next;
    });
  }, [userId]);

  return { recent, addRecent, removeRecent };
}
