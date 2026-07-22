import { useTranslation } from "react-i18next";
import { Clapperboard, Star, TrendingUp, Trophy } from "lucide-react";
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

  return (
    <div className="user-page__section">
      <p className="user-page__section-title">{t('userPage.sectionStats')}</p>
      <div className="user-page__stat-grid">
        <div className="user-page__stat-tile">
          <span className="user-page__stat-icon user-page__stat-icon--amber"><Star size={20} /></span>
          <div className="user-page__stat-body">
            <span className="user-page__stat-value">{rating ? rating.ratingCount : "—"}</span>
            <span className="user-page__stat-label">{t('userPage.statMoviesRated')}</span>
          </div>
        </div>
        <div className="user-page__stat-tile">
          <span className="user-page__stat-icon user-page__stat-icon--green"><TrendingUp size={20} /></span>
          <div className="user-page__stat-body">
            <span className="user-page__stat-value">{rating?.averageRatingGiven != null ? rating.averageRatingGiven.toFixed(1) : "—"}</span>
            <span className="user-page__stat-label">{t('userPage.statAvgGiven')}</span>
          </div>
        </div>
        <div className="user-page__stat-tile">
          <span className="user-page__stat-icon user-page__stat-icon--blue"><Clapperboard size={20} /></span>
          <div className="user-page__stat-body">
            <span className="user-page__stat-value">{rating?.averageRatingAsHost != null ? rating.averageRatingAsHost.toFixed(1) : "—"}</span>
            <span className="user-page__stat-label">{t('userPage.statAvgAsHost')}</span>
          </div>
        </div>
        <div className="user-page__stat-tile">
          <span className="user-page__stat-icon user-page__stat-icon--purple"><Trophy size={20} /></span>
          <div className="user-page__stat-body">
            <span className="user-page__stat-value">{hostRank > 0 ? `#${hostRank}` : "—"}</span>
            <span className="user-page__stat-label">{t('userPage.statHostRank')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
