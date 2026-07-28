import { useState } from "react";
import "../stats.css";
import { StatPageSkeleton } from "./StatPageSkeleton.tsx";
import { fetchStats } from "../api/stats.ts";
import { MoviePodium } from "./MoviePodium.tsx";
import { UsersRatingChart } from "./UsersRatingChart.tsx";
import { useAsync } from "@/hooks/useAsync.ts";
import { useSwipeBack } from "@/hooks/useSwipeBack.ts";
import { useAnimatedClose } from "@/hooks/useAnimatedClose.ts";
import { PAGE_EXIT_MS } from "@/components/Presence.tsx";
import { PageBackButton } from "@/components/PageBackButton.tsx";
import { ErrorScreen } from "@/components/ErrorScreen.tsx";
import { useTranslation } from "react-i18next";

type StatPageProps = {
  active: boolean;
  onBack: () => void;
};

const StatPage = ({ active, onBack }: StatPageProps) => {
  const { t } = useTranslation();
  const state = useAsync(() => fetchStats("desc"), []);
  const [sectionEl, setSectionEl] = useState<HTMLElement | null>(null);
  const close = useAnimatedClose(sectionEl, "stat-page--closing", PAGE_EXIT_MS, onBack);

  useSwipeBack(onBack, active ? sectionEl : null);

  const renderBody = () => {
    if (state.status === "loading") return <StatPageSkeleton />;
    if (state.status === "error") {
      return (
        <>
          <PageBackButton onBack={close} active={active} />
          <ErrorScreen error={state.error} />
        </>
      );
    }

    const { bestMovies, worstMovies, usersByRating } = state.data;
    const isEmpty = bestMovies.length === 0 && worstMovies.length === 0;
    return (
      <>
        <div className="page-header">
          <PageBackButton onBack={close} active={active} />
          <h1 className="page-title">{t('groupList.labelStatistics')}</h1>
        </div>
        {isEmpty ? (
          <div className="stat-empty">
            <p className="stat-empty__title">{t('stats.emptyTitle')}</p>
            <p className="stat-empty__hint">{t('stats.emptyHint')}</p>
          </div>
        ) : (
          <>
            <MoviePodium title={t('stats.podiumBest')} movies={bestMovies} variant="best" active={active} />
            <MoviePodium title={t('stats.podiumWorst')} movies={worstMovies} variant="worst" active={active} />
            <UsersRatingChart users={usersByRating} active={active} />
          </>
        )}
      </>
    );
  };

  return (
    <section className="stat-page" ref={setSectionEl}>
      {renderBody()}
    </section>
  );
};

export default StatPage;
