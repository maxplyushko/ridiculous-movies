import { PageLoader } from "./PageLoader.tsx";
import { useEffect, useState } from "react";
import { fetchStats } from "../api/stats.ts";
import type { Stats } from "../types/Stat.ts";
import { MoviePodium } from "./MoviePodium.tsx";
import { UsersRatingChart } from "./UsersRatingChart.tsx";

type StatPageProps = {
  active: boolean;
};

const StatPage = ({ active }: StatPageProps) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [stats, setStats] = useState<Stats>();

  useEffect(() => {
    let cancelled = false;
    fetchStats("desc")
      .then((data) => {
        if (!cancelled) setStats(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      })
      .finally(() => {
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <PageLoader />;
  if (error) {
    return (
      <section className="stat-page">
        <p className="stat-page__error">Error: {error.message}</p>
      </section>
    );
  }
  if (!stats) {
    return (
      <section className="stat-page">
        <p className="stat-page__error">No stats available.</p>
      </section>
    );
  }

  return (
    <section className="stat-page">
      <MoviePodium
        title="Top 3 best"
        movies={stats.bestMovies}
        variant="best"
        active={active}
      />
      <MoviePodium
        title="Top 3 worst"
        movies={stats.worstMovies}
        variant="worst"
        active={active}
      />
      <UsersRatingChart users={stats.usersByRating} active={active} />
    </section>
  );
};

export default StatPage;
