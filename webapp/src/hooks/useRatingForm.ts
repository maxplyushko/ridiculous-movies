import { useState } from "react";
import type { Movie } from "@/features/group/types/Movie.ts";

export type DetailedScores = {
  r1: number | null;
  r2: number | null;
  r3: number | null;
};

export type RatingMode = "detailed" | "classic";

export type RatingForm = {
  id: string;
  userId: string;
  scoreInput: string;
  mode: RatingMode;
  detailed: DetailedScores;
};

function parseScoreInput(raw: string): number {
  const t = raw.trim();
  if (t === "") return 0;
  const n = Number(t.replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

export function calcDetailedScore(d: DetailedScores): number | null {
  if (d.r1 === null || d.r2 === null || d.r3 === null) return null;
  return Math.round(((d.r1 + d.r2 + d.r3) / 3) * 4) / 4;
}

const SCORE_MAX = 10;

function clampScore(n: number): number {
  return Math.min(SCORE_MAX, Math.max(0, n));
}

function seedDetailed(score: number): DetailedScores {
  return score > 0 ? { r1: score, r2: score, r3: score } : { r1: null, r2: null, r3: null };
}

function initialForms(movie: Movie | undefined): RatingForm[] {
  return movie
    ? movie.ratings.map((r) => ({
        id: crypto.randomUUID(),
        userId: r.user.id,
        scoreInput: String(r.score),
        mode: "detailed" as RatingMode,
        detailed: seedDetailed(r.score),
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

  const add = () =>
    setForms((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        userId: "",
        scoreInput: "0",
        mode: "detailed" as RatingMode,
        detailed: { r1: null, r2: null, r3: null },
      },
    ]);

  const remove = (id: string) =>
    setForms((prev) => prev.filter((f) => f.id !== id));

  const updateUser = (id: string, userId: string) =>
    setForms((prev) => prev.map((f) => (f.id === id ? { ...f, userId } : f)));

  const updateScore = (id: string, scoreInput: string) =>
    setForms((prev) => prev.map((f) => (f.id === id ? { ...f, scoreInput } : f)));

  const updateMode = (id: string, mode: RatingMode) =>
    setForms((prev) => prev.map((f) => {
      if (f.id !== id) return f;
      let { scoreInput, detailed } = f;
      if (mode === "classic" && f.mode === "detailed") {
        const s = calcDetailedScore(f.detailed);
        if (s !== null) scoreInput = String(Math.round(s));
      } else if (mode === "detailed" && f.mode === "classic") {
        const v = parseScoreInput(f.scoreInput);
        if (v > 0) detailed = { r1: v, r2: v, r3: v };
      }
      return { ...f, mode, scoreInput, detailed };
    }));

  const updateDetailed = (id: string, field: keyof DetailedScores, value: number | null) =>
    setForms((prev) =>
      prev.map((f) => (f.id === id ? { ...f, detailed: { ...f.detailed, [field]: value } } : f))
    );

  const buildRatings = () =>
    forms
      .filter((f) => f.userId !== "")
      .map((f) => ({
        userId: f.userId,
        score:
          f.mode === "detailed"
            ? (calcDetailedScore(f.detailed) ?? clampScore(parseScoreInput(f.scoreInput)))
            : clampScore(parseScoreInput(f.scoreInput)),
      }));

  return { forms, add, remove, updateUser, updateScore, updateMode, updateDetailed, buildRatings };
}