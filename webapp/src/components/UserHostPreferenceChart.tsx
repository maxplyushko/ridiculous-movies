import type { UserHostPreference } from "../types/Stat.ts";

type Props = {
  preferences: UserHostPreference[];
};

function fmt(value: number | null): string {
  return value == null ? "—" : value.toFixed(1);
}

export function UserHostPreferenceChart({ preferences }: Readonly<Props>) {
  if (preferences.length === 0) return null;

  return (
    <div className="stat-host-pref">
      <h2 className="stat-host-pref__title">Rating tendencies</h2>
      <div className="stat-host-pref__grid">
        <span className="stat-host-pref__col-head">Rater</span>
        <span className="stat-host-pref__col-head">Avg</span>
        <span className="stat-host-pref__col-head stat-host-pref__col-head--best">Most loved</span>
        <span className="stat-host-pref__col-head stat-host-pref__col-head--worst">Least loved</span>
        {preferences.map((p) => {
          const singleHost = p.mostFavHostName != null && p.mostFavHostName === p.leastFavHostName;
          return (
            <>
              <span key={`${p.userId}-name`} className="stat-host-pref__cell stat-host-pref__cell--name">{p.userName}</span>
              <span key={`${p.userId}-avg`} className="stat-host-pref__cell stat-host-pref__cell--avg">{fmt(p.overallAverage)}</span>
              <span key={`${p.userId}-best`} className="stat-host-pref__cell stat-host-pref__cell--best">
                {p.mostFavHostName ?? "—"}
                {p.mostFavHostAvg != null && <span className="stat-host-pref__score"> {fmt(p.mostFavHostAvg)}</span>}
              </span>
              <span key={`${p.userId}-worst`} className="stat-host-pref__cell stat-host-pref__cell--worst">
                {singleHost ? "—" : (p.leastFavHostName ?? "—")}
                {!singleHost && p.leastFavHostAvg != null && <span className="stat-host-pref__score"> {fmt(p.leastFavHostAvg)}</span>}
              </span>
            </>
          );
        })}
      </div>
    </div>
  );
}
