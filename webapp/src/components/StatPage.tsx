import { useEffect, useRef, useState } from "react";
import { StatPageSkeleton } from "./StatPageSkeleton.tsx";
import { fetchStats } from "../api/stats.ts";
import { MoviePodium } from "./MoviePodium.tsx";
import { UsersRatingChart } from "./UsersRatingChart.tsx";
import { UserHostPreferenceChart } from "./UserHostPreferenceChart.tsx";
import { useAsync } from "../hooks/useAsync.ts";
import { useSwipeBack } from "../hooks/useSwipeBack.ts";
import { getTelegramWebApp, isTelegramMiniApp } from "../api/telegram.ts";
import { useTranslation } from "react-i18next";
import { ChevronLeft } from "lucide-react";

type StatPageProps = {
  active: boolean;
  onBack: () => void;
};

const StatPage = ({ active, onBack }: StatPageProps) => {
  const { t } = useTranslation();
  const state = useAsync(() => fetchStats("desc"), []);
  const [sectionEl, setSectionEl] = useState<HTMLElement | null>(null);
  const onBackRef = useRef(onBack);
  onBackRef.current = onBack;

  useEffect(() => {
    if (!active) return;
    const btn = getTelegramWebApp()?.BackButton;
    if (!btn) return;
    const handler = () => onBackRef.current();
    btn.show();
    btn.onClick(handler);
    return () => {
      btn.offClick(handler);
      btn.hide();
    };
  }, [active]);

  useSwipeBack(onBack, active ? sectionEl : null);

  const isTg = isTelegramMiniApp();

  if (state.status === "loading") return <StatPageSkeleton />;
  if (state.status === "error") {
    return (
      <section className="stat-page">
        <p className="stat-page__error">Error: {state.error.message}</p>
      </section>
    );
  }

  const { bestMovies, worstMovies, usersByRating, userHostPreferences } = state.data;
  return (
    <section className="stat-page" ref={setSectionEl}>
      {!isTg && (
        <button type="button" className="stat-page__back" onClick={onBack}>
          <ChevronLeft size={20} />
          {t('nav.back')}
        </button>
      )}
      <MoviePodium title={t('stats.podiumBest')} movies={bestMovies} variant="best" active={active} />
      <MoviePodium title={t('stats.podiumWorst')} movies={worstMovies} variant="worst" active={active} />
      <UsersRatingChart users={usersByRating} active={active} />
      <UserHostPreferenceChart preferences={userHostPreferences} />
    </section>
  );
};

export default StatPage;
