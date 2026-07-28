import { useEffect, useRef, useState } from "react";
import type { PersonalMovie } from "@/features/personal/types/PersonalMovie";
import type { TmdbMediaType } from "@/types/TmdbMovie";
import { fetchMyStatus, setPersonalState } from "@/features/personal/api/personalList.ts";

interface Identity {
  tmdbId?: number | null;
  title: string;
  description?: string;
  tagline?: string | null;
  tmdbMediaType?: TmdbMediaType | null;
  onChange?: () => void;
  onError?: (message: string) => void;
}

type Flags = { inList: boolean; watched: boolean };

export function usePersonalStateSync({ tmdbId, title, description, tagline, tmdbMediaType, onChange, onError }: Identity) {
  const [selfStatus, setSelfStatus] = useState<PersonalMovie | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);

  const confirmedRef = useRef<Flags>({ inList: false, watched: false });
  const desiredRef = useRef<Flags>({ inList: false, watched: false });
  const inFlightRef = useRef(false);

  const identityRef = useRef({ tmdbId, title, description, tagline, tmdbMediaType });
  const onChangeRef = useRef(onChange);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    identityRef.current = { tmdbId, title, description, tagline, tmdbMediaType };
    onChangeRef.current = onChange;
    onErrorRef.current = onError;
  });

  useEffect(() => {
    if (tmdbId == null && !title) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStatusLoading(true);
    fetchMyStatus(tmdbId, title)
      .then((s) => {
        if (cancelled) return;
        setSelfStatus(s);
        const flags = { inList: s?.inList ?? false, watched: s?.watched ?? false };
        confirmedRef.current = flags;
        desiredRef.current = { ...flags };
      })
      .catch(() => { if (!cancelled) setSelfStatus(null); })
      .finally(() => { if (!cancelled) setStatusLoading(false); });
    return () => { cancelled = true; };
  }, [tmdbId, title]);

  const flush = () => {
    if (inFlightRef.current) return;
    const desired = desiredRef.current;
    if (desired.inList === confirmedRef.current.inList && desired.watched === confirmedRef.current.watched) return;

    inFlightRef.current = true;
    const { tmdbId, title, description, tagline, tmdbMediaType } = identityRef.current;
    setPersonalState({
      tmdbId,
      title,
      description: description ?? "",
      tagline: tagline ?? "",
      tmdbMediaType,
      inList: desired.inList,
      watched: desired.watched,
    })
      .then((next) => {
        confirmedRef.current = { inList: next?.inList ?? false, watched: next?.watched ?? false };
        setSelfStatus(next);
        onChangeRef.current?.();
        inFlightRef.current = false;
        flush();
      })
      .catch((e) => {
        desiredRef.current = { ...confirmedRef.current };
        setSelfStatus((prev) => (prev ? { ...prev, ...confirmedRef.current } : prev));
        inFlightRef.current = false;
        if (e instanceof Error) onErrorRef.current?.(e.message);
      });
  };

  const apply = (patch: Partial<Flags>) => {
    desiredRef.current = { ...desiredRef.current, ...patch };
    const flags = desiredRef.current;
    setSelfStatus((prev) => ({
      ...(prev ?? {
        id: "",
        title,
        description: description ?? "",
        tagline: tagline ?? "",
        rating: null,
        createdAt: "",
        updatedAt: "",
        tmdbId: tmdbId ?? undefined,
        tmdbMediaType: tmdbMediaType ?? undefined,
        inList: false,
        watched: false,
      }),
      ...flags,
    }));
    flush();
  };

  return {
    selfStatus,
    statusLoading,
    setInList: (next: boolean) => apply({ inList: next }),
    setWatched: (next: boolean) => apply({ watched: next }),
  };
}
