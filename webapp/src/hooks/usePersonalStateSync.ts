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
  skip?: boolean;
  onChange?: () => void;
  onError?: (message: string) => void;
}

type Flags = { inList: boolean; watched: boolean };

export function usePersonalStateSync({ tmdbId, title, description, tagline, tmdbMediaType, skip, onChange, onError }: Identity) {
  const [selfStatus, setSelfStatus] = useState<PersonalMovie | null>(null);
  const [statusLoading, setStatusLoading] = useState(!skip);

  const confirmedRef = useRef<Flags>({ inList: false, watched: false });
  const desiredRef = useRef<Flags>({ inList: false, watched: false });
  const inFlightRef = useRef(false);
  const pendingRatingRef = useRef<number | null | undefined>(undefined);

  const identityRef = useRef({ tmdbId, title, description, tagline, tmdbMediaType });
  const onChangeRef = useRef(onChange);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    identityRef.current = { tmdbId, title, description, tagline, tmdbMediaType };
    onChangeRef.current = onChange;
    onErrorRef.current = onError;
  });

  useEffect(() => {
    if (skip) return;
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
  }, [tmdbId, title, skip]);

  const flush = () => {
    if (inFlightRef.current) return;
    const desired = desiredRef.current;
    const ratingPending = pendingRatingRef.current !== undefined;
    const flagsChanged = desired.inList !== confirmedRef.current.inList || desired.watched !== confirmedRef.current.watched;
    if (!flagsChanged && !ratingPending) return;

    inFlightRef.current = true;
    const ratingToSend = pendingRatingRef.current;
    if (ratingPending) pendingRatingRef.current = undefined;
    const { tmdbId, title, description, tagline, tmdbMediaType } = identityRef.current;
    setPersonalState({
      tmdbId,
      title,
      description: description ?? "",
      tagline: tagline ?? "",
      tmdbMediaType,
      inList: desired.inList,
      watched: desired.watched,
      ...(ratingPending ? { rating: ratingToSend } : {}),
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
        if (ratingPending) pendingRatingRef.current = ratingToSend;
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

  const setRating = (score: number) => {
    pendingRatingRef.current = score;
    setSelfStatus((prev) => (prev ? { ...prev, rating: score } : prev));
    flush();
  };

  return {
    selfStatus,
    statusLoading,
    setInList: (next: boolean) => apply({ inList: next }),
    setWatched: (next: boolean) => apply({ watched: next }),
    setRating,
  };
}
