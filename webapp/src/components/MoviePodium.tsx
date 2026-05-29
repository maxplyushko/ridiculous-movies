import { type CSSProperties, useEffect, useState } from "react";
import { hapticBarGrowTick } from "../haptics.ts";
import type { MovieHighlight } from "../types/Stat.ts";

type Variant = "best" | "worst";

/** Stagger order: 2nd, 1st, 3rd (left → right on stage). */
export const PODIUM_STAGGER_MS = 70;

type Props = {
  title: string;
  movies: MovieHighlight[];
  variant: Variant;
  /** Stat tab visible — triggers step grow animation. */
  active: boolean;
};

function prefersReducedMotion(): boolean {
  return (
    globalThis.window !== undefined &&
    globalThis.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/** Classic podium layout: 2nd · 1st · 3rd (left to right). */
function podiumSlots(movies: MovieHighlight[]): (MovieHighlight | null)[] {
  const byPlace = [...movies].sort((a, b) => a.place - b.place);
  const first = byPlace.find((m) => m.place === 1) ?? byPlace[0] ?? null;
  const second = byPlace.find((m) => m.place === 2) ?? byPlace[1] ?? null;
  const third = byPlace.find((m) => m.place === 3) ?? byPlace[2] ?? null;
  return [second, first, third];
}

const SLOT_META = [
  { podiumPlace: 2, stepClass: "stat-podium__step--2" },
  { podiumPlace: 1, stepClass: "stat-podium__step--1" },
  { podiumPlace: 3, stepClass: "stat-podium__step--3" },
] as const;

function PodiumSlot({
  movie,
  podiumPlace,
  stepClass,
  variant,
  grow,
  staggerIndex,
}: {
  movie: MovieHighlight | null;
  podiumPlace: 1 | 2 | 3;
  stepClass: string;
  variant: Variant;
  grow: boolean;
  staggerIndex: number;
}) {
  if (!movie) {
    return (
      <div className="stat-podium__slot stat-podium__slot--empty" aria-hidden="true">
        <div className={`stat-podium__step ${stepClass}`} />
      </div>
    );
  }

  return (
    <article className="stat-podium__slot">
      <div className="stat-podium__card">
        <span className={`stat-podium__medal stat-podium__medal--${variant}-${podiumPlace}`}>
          {podiumPlace}
        </span>
        <p className="stat-podium__title">{movie.title}</p>
        <p className="stat-podium__host">{movie.host}</p>
        <p className={`stat-podium__rating stat-podium__rating--${variant}`}>
          {movie.averageRating.toFixed(2)}
        </p>
      </div>
      <div
        className={`stat-podium__step ${stepClass}${grow ? " stat-podium__step--grow" : ""}`}
        style={
          { "--podium-delay": `${staggerIndex * PODIUM_STAGGER_MS}ms` } as CSSProperties
        }
        aria-hidden="true"
      />
    </article>
  );
}

export function MoviePodium({ title, movies, variant, active }: Props) {
  const slots = podiumSlots(movies);
  const filledCount = slots.filter((m) => m !== null).length;
  const [grow, setGrow] = useState(false);

  useEffect(() => {
    if (!active) {
      setGrow(false);
      return;
    }

    const timeouts: ReturnType<typeof setTimeout>[] = [];
    const frame = requestAnimationFrame(() => {
      setGrow(true);

      if (!prefersReducedMotion()) {
        for (let i = 0; i < filledCount; i++) {
          timeouts.push(
            setTimeout(() => hapticBarGrowTick(), i * PODIUM_STAGGER_MS),
          );
        }
      }
    });

    return () => {
      cancelAnimationFrame(frame);
      timeouts.forEach(clearTimeout);
      setGrow(false);
    };
  }, [active, filledCount]);

  return (
    <section className={`stat-podium stat-podium--${variant}`}>
      <h2 className="stat-podium__heading">{title}</h2>
      <div className="stat-podium__stage">
        {SLOT_META.map((meta, index) => (
          <PodiumSlot
            key={meta.podiumPlace}
            movie={slots[index]}
            podiumPlace={meta.podiumPlace}
            stepClass={meta.stepClass}
            variant={variant}
            grow={grow && slots[index] !== null}
            staggerIndex={index}
          />
        ))}
      </div>
    </section>
  );
}
