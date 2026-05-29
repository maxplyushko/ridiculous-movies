import {type CSSProperties, useEffect, useState} from "react";
import {hapticBarGrowTick} from "../haptics.ts";
import type {UserStats} from "../types/Stat.ts";

const MAX_SCORE = 10;
export const BAR_STAGGER_MS = 70;

type Props = {
  users: UserStats[];
  /** Stat tab visible — triggers grow animation. */
  active: boolean;
};

function prefersReducedMotion(): boolean {
  return (
      globalThis.window !== undefined &&
      globalThis.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function UsersRatingChart({users, active}: Props) {
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
        for (let i = 0; i < users.length; i++) {
          timeouts.push(
              setTimeout(() => hapticBarGrowTick(), i * BAR_STAGGER_MS),
          );
        }
      }
    });

    return () => {
      cancelAnimationFrame(frame);
      timeouts.forEach(clearTimeout);
      setGrow(false);
    };
  }, [active, users]);

  return (
      <div className="stat-chart">
        <h2 className="stat-chart__title">Users by avg rating</h2>
        <ul className="stat-bars" aria-label="Users by average rating">
          {users.map((user, index) => {
            const score = user.averageRatingGiven ?? 0;
            const pct = Math.min(100, (score / MAX_SCORE) * 100);
            return (
                <li key={user.id} className="stat-bars__row">
                  <span className="stat-bars__name">{user.name}</span>
                  <div className="stat-bars__track" aria-hidden="true">
                    <div
                        className={`stat-bars__fill${grow ? " stat-bars__fill--grow" : ""}`}
                        style={
                          {
                            "--bar-pct": `${pct}%`,
                            "--bar-delay": `${index * BAR_STAGGER_MS}ms`,
                          } as CSSProperties
                        }
                    />
                  </div>
                  <span className="stat-bars__value">
                {Number.isFinite(score) ? score.toFixed(2) : "—"}
              </span>
                </li>
            );
          })}
        </ul>
      </div>
  );
}
