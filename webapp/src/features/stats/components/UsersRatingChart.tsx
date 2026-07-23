import { type CSSProperties, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { User } from "lucide-react";
import { hapticBarGrowTick } from "@/utils/haptics.ts";
import type { UserStats } from "../types/Stat.ts";

export const HOST_STAGGER_MS = 70;

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

function rankedHosts(users: UserStats[]): (UserStats & { averageRatingAsHost: number })[] {
  return users
      .filter((u): u is UserStats & { averageRatingAsHost: number } => u.averageRatingAsHost != null)
      .sort((a, b) => b.averageRatingAsHost - a.averageRatingAsHost);
}

const SLOT_META = [
  { podiumPlace: 2, stepClass: "stat-podium__step--2" },
  { podiumPlace: 1, stepClass: "stat-podium__step--1" },
  { podiumPlace: 3, stepClass: "stat-podium__step--3" },
] as const;

function HostSlot({
  host,
  podiumPlace,
  stepClass,
  grow,
  staggerIndex,
}: Readonly<{
  host: (UserStats & { averageRatingAsHost: number }) | null;
  podiumPlace: 1 | 2 | 3;
  stepClass: string;
  grow: boolean;
  staggerIndex: number;
}>) {
  if (!host) {
    return (
        <div className="stat-podium__slot stat-podium__slot--empty" aria-hidden="true">
          <div className={`stat-podium__step ${stepClass}`} />
        </div>
    );
  }

  return (
      <article className="stat-podium__slot">
        <div className="stat-podium__card">
          <span className={`stat-podium__medal stat-podium__medal--best-${podiumPlace}`}>
            {podiumPlace}
          </span>
          <p className="stat-podium__title">{host.name}</p>
        </div>
        <div
            className={`stat-podium__step ${stepClass}${grow ? " stat-podium__step--grow" : ""}`}
            style={{ "--podium-delay": `${staggerIndex * HOST_STAGGER_MS}ms` } as CSSProperties}
            aria-label={`Rating ${host.averageRatingAsHost.toFixed(2)}`}
        >
          <span className="stat-podium__step-score">
            {host.averageRatingAsHost.toFixed(2)}
          </span>
        </div>
      </article>
  );
}

export function UsersRatingChart({ users, active }: Readonly<Props>) {
  const { t } = useTranslation();
  const [triggered, setTriggered] = useState(false);
  const grow = active && triggered;

  const ranked = rankedHosts(users);
  const top3 = ranked.slice(0, 3);
  const rest = ranked.slice(3);
  const slots: ((UserStats & { averageRatingAsHost: number }) | null)[] = [
    top3[1] ?? null,
    top3[0] ?? null,
    top3[2] ?? null,
  ];
  const filledCount = slots.filter((s) => s !== null).length;

  useEffect(() => {
    if (!active) return;

    const timeouts: ReturnType<typeof setTimeout>[] = [];
    const frame = requestAnimationFrame(() => {
      setTriggered(true);

      if (!prefersReducedMotion()) {
        for (let i = 0; i < filledCount; i++) {
          timeouts.push(
              setTimeout(() => hapticBarGrowTick(), i * HOST_STAGGER_MS),
          );
        }
      }
    });

    return () => {
      cancelAnimationFrame(frame);
      timeouts.forEach(clearTimeout);
      setTriggered(false);
    };
  }, [active, filledCount]);

  return (
      <section className="stat-podium stat-podium--best">
        <h2 className="stat-podium__heading">{t("stats.hostsByRating")}</h2>
        <div className="stat-podium__stage">
          {SLOT_META.map((meta, index) => (
              <HostSlot
                  key={meta.podiumPlace}
                  host={slots[index]}
                  podiumPlace={meta.podiumPlace}
                  stepClass={meta.stepClass}
                  grow={grow && slots[index] !== null}
                  staggerIndex={index}
              />
          ))}
        </div>
        {rest.length > 0 && (
            <ul className="host-rank">
              {rest.map((host, index) => (
                  <li key={host.id} className="host-rank__row">
                    <span className="host-rank__place">{index + 4}</span>
                    <span className="host-rank__avatar" aria-hidden="true">
                      <User size={16} />
                    </span>
                    <span className="host-rank__name">{host.name}</span>
                    <span className="host-rank__value">
                      {host.averageRatingAsHost.toFixed(2)}
                    </span>
                  </li>
              ))}
            </ul>
        )}
      </section>
  );
}
