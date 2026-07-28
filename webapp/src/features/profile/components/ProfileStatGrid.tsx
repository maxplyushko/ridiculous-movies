import { useTranslation } from "react-i18next";
import { Clapperboard, TrendingUp, Trophy } from "lucide-react";
import type { Stats } from "@/features/stats/types/Stat.ts";

export function ProfileStatGrid({ userId, stats }: Readonly<{ userId: string; stats: Stats | null }>) {
  const { t } = useTranslation();
  const rating = stats?.usersByRating.find((u) => u.id === userId) ?? null;
  const hostRank = stats && rating?.averageRatingAsHost != null
    ? [...stats.usersByRating]
        .filter((u) => u.averageRatingAsHost != null)
        .sort((a, b) => (b.averageRatingAsHost ?? 0) - (a.averageRatingAsHost ?? 0))
        .findIndex((u) => u.id === userId) + 1
    : 0;
  const hostPref = stats?.userHostPreferences.find((u) => u.userId === userId) ?? null;

  return (
    <div className="user-page__section">
      <p className="user-page__section-title">{t('userPage.sectionStats')}</p>
      <div className="user-page__stat-card">
        <div className="user-page__stat-strip">
          <div className="user-page__stat-cell">
            <span className="user-page__stat-cell-top">
              <TrendingUp size={13} className="user-page__stat-glyph--green" />
              <span className="user-page__stat-cell-value">{rating?.averageRatingGiven != null ? rating.averageRatingGiven.toFixed(1) : "—"}</span>
            </span>
            <span className="user-page__stat-cell-label">{t('userPage.statAvgGiven')}</span>
          </div>
          <div className="user-page__stat-cell">
            <span className="user-page__stat-cell-top">
              <Clapperboard size={13} className="user-page__stat-glyph--blue" />
              <span className="user-page__stat-cell-value">{rating?.averageRatingAsHost != null ? rating.averageRatingAsHost.toFixed(1) : "—"}</span>
            </span>
            <span className="user-page__stat-cell-label">{t('userPage.statAvgAsHost')}</span>
          </div>
          <div className="user-page__stat-cell">
            <span className="user-page__stat-cell-top">
              <Trophy size={13} className="user-page__stat-glyph--purple" />
              <span className="user-page__stat-cell-value">{hostRank > 0 ? `#${hostRank}` : "—"}</span>
            </span>
            <span className="user-page__stat-cell-label">{t('userPage.statHostRank')}</span>
          </div>
        </div>
        <div className="user-page__stat-hosts">
          <div className="user-page__stat-host">
            <span className="user-page__stat-host-score user-page__stat-host-score--fav">
              {hostPref?.mostFavHostAvg != null ? hostPref.mostFavHostAvg.toFixed(1) : "—"}
            </span>
            <span className="user-page__stat-host-body">
              <span className="user-page__stat-host-name">{hostPref?.mostFavHostName ?? "—"}</span>
              <span className="user-page__stat-cell-label">{t('userPage.statFavHost')}</span>
            </span>
          </div>
          <div className="user-page__stat-host">
            <span className="user-page__stat-host-score user-page__stat-host-score--least">
              {hostPref?.leastFavHostAvg != null ? hostPref.leastFavHostAvg.toFixed(1) : "—"}
            </span>
            <span className="user-page__stat-host-body">
              <span className="user-page__stat-host-name">{hostPref?.leastFavHostName ?? "—"}</span>
              <span className="user-page__stat-cell-label">{t('userPage.statLeastFavHost')}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
