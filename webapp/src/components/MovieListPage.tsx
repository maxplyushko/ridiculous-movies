import {useEffect, useState} from "react";
import type {Movie} from "../types/Movie.ts";
import MovieItem from "./MovieItem.tsx";

/** Same-origin `/api` — proxied to Spring in dev/preview (see vite.config). */
const MOVIES_URL = "/api/movies";

type ListParams = {
  filter?: "top_rating" | "lowest_rating";
  sort?: "asc" | "desc";
};

async function fetchMovies(params: ListParams = {}): Promise<Movie[]> {
  const query = new URLSearchParams(params as Record<string, string>).toString();
  const url = query ? `${MOVIES_URL}?${query}` : MOVIES_URL;
  const response = await fetch(url);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `HTTP ${response.status}`);
  }
  return await response.json() as Promise<Movie[]>;
}

const MovieListPage = () => {
  const [movies, setMovies] = useState<Movie[]>([])
  const [isLoading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    fetchMovies({sort: "desc"})
    .then(data => setMovies(data))
    .catch(err => setError(err))
    .finally(() => setLoading(false));
  }, []);

  if (isLoading) return <p>Loading...</p>;
  if (error) {
    console.error(error);
    return <p>Error: {error.message}</p>;
  }
  return (
      <div className="movie-list">
        { movies.map(movie => (
            <MovieItem
              key={movie.id}
              movie={movie}
              isExpanded={expandedId === movie.id}
              onToggle={() => setExpandedId(expandedId === movie.id ? null : movie.id)}
            />
        )) }
      </div>
  )
};

export default MovieListPage;
