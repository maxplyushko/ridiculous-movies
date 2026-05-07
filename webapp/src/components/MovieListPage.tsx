import {useCallback, useEffect, useState} from "react";
import type {MovieGroup, MovieGroupsResponse} from "../types/MovieGroup.ts";
import MovieItem from "./MovieItem.tsx";
import {CirclePlus} from "lucide-react";
import AddMoviePage from "./AddMoviePage.tsx";
import type {User} from "../types/User.ts";

const MOVIE_GROUPS_URL = "/api/movies/groups";

type ListParams = {
  filter?: "top_rating" | "lowest_rating";
  sort?: "asc" | "desc";
};

async function fetchMovieGroups(params: ListParams = {}): Promise<MovieGroupsResponse> {
  const query = new URLSearchParams(params as Record<string, string>).toString();
  const url = query ? `${MOVIE_GROUPS_URL}?${query}` : MOVIE_GROUPS_URL;
  const response = await fetch(url);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `HTTP ${response.status}`);
  }
  return await response.json() as Promise<MovieGroupsResponse>;
}

const MovieListPage = () => {
  const [usersLeft, setUsersLeft] = useState<User[]>([]);
  const [movieGroups, setMovieGroups] = useState<MovieGroup[]>([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAddMovieForm, setShowAddMovieForm] = useState(false);

  const loadMovieGroups = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchMovieGroups({sort: "desc"})
        .then(data => {
          setMovieGroups(data.groups);
          setUsersLeft(data.usersLeft);
          setCurrentRound(data.currentRound);
        })
        .catch(err => setError(err))
        .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      loadMovieGroups();
    });
  }, [loadMovieGroups]);

  if (isLoading) return <p>Loading...</p>;
  if (error) {
    console.error(error);
    return <p>Error: {error.message}</p>;
  }

  return (
      <div>
        <div className="movie-list">
          {movieGroups.map(movieGroup => (
              <div key={movieGroup.groupId} className="movie-group">
                <div className="movie-group__header">
                  <div className="movie-group__header__round">
                    <h3>Round {movieGroup.groupId}</h3>
                  </div>
                  <div className="add-button">
                    {movieGroup.groupId === currentRound &&
                        <button onClick={() => setShowAddMovieForm(true)}><CirclePlus size={30}/>
                        </button>}
                  </div>
                </div>
                {movieGroup.movies.map(movie => (
                    <MovieItem key={movie.id} movie={movie} isExpanded={expandedId === movie.id}
                               onToggle={() => setExpandedId(expandedId === movie.id ? null : movie.id)}/>
                ))}
              </div>
          ))}
        </div>
        {showAddMovieForm && (<div className="movie-list__add__movie">
          <AddMoviePage usersLeft={usersLeft}
                        onBack={() => {
                          setShowAddMovieForm(false);
                          loadMovieGroups();
                        }} />
        </div>)}
      </div>
  )
};

export default MovieListPage;
