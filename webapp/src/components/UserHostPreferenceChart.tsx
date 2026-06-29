import React from "react";
import { useTranslation } from "react-i18next";
import type { UserHostPreference } from "../types/Stat.ts";

type Props = {
  preferences: UserHostPreference[];
};

function fmt(value: number | null): string {
  return value == null ? "—" : value.toFixed(1);
}

export function UserHostPreferenceChart({ preferences }: Readonly<Props>) {
  const { t } = useTranslation();
  if (preferences.length === 0) return null;

  return (
    <div className="stat-host-pref">
      <h2 className="stat-host-pref__title">{t('stats.ratingTendencies')}</h2>
      <div className="stat-host-pref__grid">
        <span className="stat-host-pref__col-head">{t('stats.tableRater')}</span>
        <span className="stat-host-pref__col-head">{t('stats.tableAvg')}</span>
        <span className="stat-host-pref__col-head stat-host-pref__col-head--best">{t('stats.tableMostLoved')}</span>
        <span className="stat-host-pref__col-head stat-host-pref__col-head--worst">{t('stats.tableLeastLoved')}</span>
        {preferences.map((p) => {
          const singleHost = p.mostFavHostName != null && p.mostFavHostName === p.leastFavHostName;
          return (
            <React.Fragment key={p.userId}>
              <span className="stat-host-pref__cell stat-host-pref__cell--name">{p.userName}</span>
              <span className="stat-host-pref__cell stat-host-pref__cell--avg">{fmt(p.overallAverage)}</span>
              <span className="stat-host-pref__cell stat-host-pref__cell--best">
                {p.mostFavHostName ?? "—"}
                {p.mostFavHostAvg != null && <span className="stat-host-pref__score"> {fmt(p.mostFavHostAvg)}</span>}
              </span>
              <span className="stat-host-pref__cell stat-host-pref__cell--worst">
                {singleHost ? "—" : (p.leastFavHostName ?? "—")}
                {!singleHost && p.leastFavHostAvg != null && <span className="stat-host-pref__score"> {fmt(p.leastFavHostAvg)}</span>}
              </span>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
