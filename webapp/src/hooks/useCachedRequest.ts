import { useEffect, useState } from "react";

export function useCachedRequest<T>(
  key: string | null,
  cache: Map<string, T>,
  fetchData: (signal: AbortSignal) => Promise<T>,
) {
  const cached = key == null ? undefined : cache.get(key);
  const [data, setData] = useState<T | null>(cached ?? null);
  const [loading, setLoading] = useState(key != null && !cached);

  useEffect(() => {
    if (key == null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setData(null);
      setLoading(false);
      return;
    }

    const hit = cache.get(key);
    if (hit) {
      setData(hit);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    fetchData(controller.signal)
      .then((result) => {
        cache.set(key, result);
        setData(result);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (err instanceof Error && err.name === "AbortError") return;
        setData(null);
        setLoading(false);
      });

    return () => controller.abort();
  }, [key, cache, fetchData]);

  return { data, loading };
}
