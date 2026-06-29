import { StatPageSkeleton } from "./StatPageSkeleton.tsx";
import { fetchStats } from "../api/stats.ts";
import { MoviePodium } from "./MoviePodium.tsx";
import { UsersRatingChart } from "./UsersRatingChart.tsx";
import { UserHostPreferenceChart } from "./UserHostPreferenceChart.tsx";
import { useAsync } from "../hooks/useAsync.ts";
import { useTranslation } from "react-i18next";

type StatPageProps = {
  active: boolean;
};

const StatPage = ({ active }: StatPageProps) => {
  const { t } = useTranslation();
  const state = useAsync(() => fetchStats("desc"), []);

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
    <section className="stat-page">
      <MoviePodium title={t('stats.podiumBest')} movies={bestMovies} variant="best" active={active} />
      <MoviePodium title={t('stats.podiumWorst')} movies={worstMovies} variant="worst" active={active} />
      <UsersRatingChart users={usersByRating} active={active} />
      <UserHostPreferenceChart preferences={userHostPreferences} />
    </section>
  );
};

export default StatPage;
