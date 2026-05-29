import {PageLoader} from "./PageLoader.tsx";
import {useEffect, useState} from "react";
import {fetchStats} from "../api/stats.ts";
import type {Stats} from "../types/Stat.ts";
import {UsersRatingChart} from "./UsersRatingChart.tsx";

type MovieHighlightCardProps = Readonly<{
  heading: string;
  host: string;
  title: string;
  rating: number;
  variant: "best" | "worst";
}>;

function MovieHighlightCard({
                              heading,
                              host,
                              title,
                              rating,
                              variant,
                            }: MovieHighlightCardProps) {
  return (
      <article className={`stat-highlight stat-highlight--${variant}`}>
        <h3 className="stat-highlight__heading">{heading}</h3>
        <p className="stat-highlight__host">{host}</p>
        <p className="stat-highlight__title">{title}</p>
        <p className="stat-highlight__rating">
          {Number.isFinite(rating) ? rating.toFixed(2) : "—"}
        </p>
      </article>
  );
}

type StatPageProps = {
  active: boolean;
};

const StatPage = ({active}: StatPageProps) => {
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

  if (loading) return <PageLoader/>;
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
        <MovieHighlightCard
            heading="Best movie ever"
            host={stats.bestMovie.host}
            title={stats.bestMovie.title}
            rating={stats.bestMovie.averageRating}
            variant="best"
        />
        <MovieHighlightCard
            heading="Worst movie ever"
            host={stats.worstMovie.host}
            title={stats.worstMovie.title}
            rating={stats.worstMovie.averageRating}
            variant="worst"
        />
        <UsersRatingChart users={stats.usersByRating} active={active}/>
      </section>
  );
};

export default StatPage;
