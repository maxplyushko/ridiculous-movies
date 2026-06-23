import { useMemo, useState } from "react";
import type { Movie } from "../types/Movie.ts";

export type RatingForm = {
  id: string;
  userId: string;
  scoreInput: string;
};

function parseScoreInput(raw: string): number {
  const t = raw.trim();
  if (t === "") return 0;
  const n = Number(t.replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

const SCORE_MAX = 10;

function initialForms(movie: Movie | undefined): RatingForm[] {
  return movie
    ? movie.ratings.map((r) => ({
        id: crypto.randomUUID(),
        userId: r.user.id,
        scoreInput: String(r.score),
      }))
    : [];
}

export function useRatingForm(movie: Movie | undefined) {
  const [prevMovie, setPrevMovie] = useState(movie);
  const [forms, setForms] = useState<RatingForm[]>(() => initialForms(movie));

  if (prevMovie !== movie) {
    setPrevMovie(movie);
    setForms(initialForms(movie));
  }

  const selectedUserIds = useMemo(
    () => new Set(forms.map((f) => f.userId).filter(Boolean)),
    [forms],
  );

  const add = () =>
    setForms((prev) => [...prev, { id: crypto.randomUUID(), userId: "", scoreInput: "0" }]);

  const updateUser = (id: string, userId: string) =>
    setForms((prev) => prev.map((f) => (f.id === id ? { ...f, userId } : f)));

  const updateScore = (id: string, scoreInput: string) =>
    setForms((prev) => prev.map((f) => (f.id === id ? { ...f, scoreInput } : f)));

  const buildRatings = () =>
    forms
      .filter((f) => f.userId !== "")
      .map((f) => ({
        userId: f.userId,
        score: Math.min(SCORE_MAX, Math.max(0, parseScoreInput(f.scoreInput))),
      }));

  return { forms, selectedUserIds, add, updateUser, updateScore, buildRatings };
}
