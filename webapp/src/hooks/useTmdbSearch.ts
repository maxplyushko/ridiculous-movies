import { useEffect, useRef, useState } from "react";
import type { TmdbMovie } from "../types/TmdbMovie";
import { searchTmdb } from "@/features/group/api/tmdb";

const DEFAULT_DEBOUNCE_MS = 500;
const DEFAULT_MIN_LEN = 3;

export function useTmdbSearch(query: string, { minLen = DEFAULT_MIN_LEN, debounceMs = DEFAULT_DEBOUNCE_MS } = {}) {
  const [results, setResults] = useState<TmdbMovie[]>([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    abortRef.current?.abort();

    const trimmed = query.trim();
    if (trimmed.length < minLen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    timerRef.current = setTimeout(() => {
      const controller = new AbortController();
      abortRef.current = controller;

      searchTmdb(trimmed, controller.signal)
        .then((data) => {
          setResults(data);
          setLoading(false);
        })
        .catch((err: unknown) => {
          if (err instanceof Error && err.name === "AbortError") return;
          setResults([]);
          setLoading(false);
        });
    }, debounceMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      abortRef.current?.abort();
    };
  }, [query, minLen, debounceMs]);

  return { results, loading };
}
