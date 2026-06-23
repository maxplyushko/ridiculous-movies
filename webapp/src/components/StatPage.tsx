import { PageLoader } from "./PageLoader.tsx";
import { fetchStats } from "../api/stats.ts";
import { MoviePodium } from "./MoviePodium.tsx";
import { UsersRatingChart } from "./UsersRatingChart.tsx";
import { UserHostPreferenceChart } from "./UserHostPreferenceChart.tsx";
import { useAsync } from "../hooks/useAsync.ts";

type StatPageProps = {
  active: boolean;
};

const StatPage = ({ active }: StatPageProps) => {
  const state = useAsync(() => fetchStats("desc"), []);

  if (state.status === "loading") return <PageLoader />;
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
      <MoviePodium title="Top 3 best" movies={bestMovies} variant="best" active={active} />
      <MoviePodium title="Top 3 worst" movies={worstMovies} variant="worst" active={active} />
      <UsersRatingChart users={usersByRating} active={active} />
      <UserHostPreferenceChart preferences={userHostPreferences} />
    </section>
  );
};

export default StatPage;
