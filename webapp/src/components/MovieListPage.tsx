import {useCallback, useEffect, useState} from "react";
import type {MovieGroup} from "../types/MovieGroup.ts";
import type {Movie} from "../types/Movie.ts";
import MovieItem from "./MovieItem.tsx";
import {CirclePlus} from "lucide-react";
import AddMoviePage from "./AddMoviePage.tsx";
import {deleteMovie, fetchMovieGroups} from "../api/movies.ts";
import {PageLoader} from "./PageLoader.tsx";

const MovieListPage = () => {
  const [movieGroups, setMovieGroups] = useState<MovieGroup[]>([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showMovieForm, setShowMovieForm] = useState(false);
  const [editingMovie, setEditingMovie] = useState<Movie | undefined>(undefined);
  const [movieToDelete, setMovieToDelete] = useState<Movie | null>(null);
  const [openSwipeId, setOpenSwipeId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const loadMovieGroups = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchMovieGroups({sort: "desc"})
    .then(data => {
      setMovieGroups(data.groups);
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

  const closeMovieForm = () => {
    setShowMovieForm(false);
    setEditingMovie(undefined);
    loadMovieGroups();
  };

  const handleEdit = (movie: Movie) => {
    setOpenSwipeId(null);
    setEditingMovie(movie);
    setShowMovieForm(true);
  };

  const handleDelete = (movie: Movie) => {
    setDeleteError(null);
    setMovieToDelete(movie);
  };

  const executeDelete = async () => {
    if (!movieToDelete) return;

    try {
      await deleteMovie(movieToDelete.id);
      setMovieToDelete(null);
      setDeleteError(null);
      loadMovieGroups();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete movie");
    }
  };

  const cancelDelete = () => {
    setMovieToDelete(null);
    setDeleteError(null);
  };

  if (!isLoading) {
    return <PageLoader/>;
  }
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
                        <button onClick={() => {
                          setEditingMovie(undefined);
                          setShowMovieForm(true);
                        }}><CirclePlus size={30}/>
                        </button>}
                  </div>
                </div>
                {movieGroup.movies.map(movie => (
                    <MovieItem
                        key={movie.id}
                        movie={movie}
                        isExpanded={expandedId === movie.id}
                        isSwipeOpen={openSwipeId === movie.id}
                        onToggle={() => {
                          setOpenSwipeId(null);
                          setExpandedId(expandedId === movie.id ? null : movie.id);
                        }}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onSwipeOpen={() => setOpenSwipeId(movie.id)}
                        onSwipeClose={() => setOpenSwipeId(current => current === movie.id ? null : current)}
                        onSwipeBegin={() => {
                          if (openSwipeId !== null && openSwipeId !== movie.id) {
                            setOpenSwipeId(null);
                          }
                        }}
                    />
                ))}
              </div>
          ))}
        </div>
        {showMovieForm && (
            <div className="movie-list__add__movie">
              <AddMoviePage
                  currentRound={currentRound}
                  movie={editingMovie}
                  onBack={closeMovieForm}
              />
            </div>
        )}
        {movieToDelete && (
            <div className="confirm-dialog-overlay">
              <div className="confirm-dialog">
                <p>Delete "{movieToDelete.title}"?</p>
                {deleteError && (
                    <span className="confirm-dialog__error">{deleteError}</span>
                )}
                <div className="confirm-dialog__actions">
                  <button type="button" onClick={cancelDelete}>Cancel</button>
                  <button type="button" onClick={executeDelete}>Delete</button>
                </div>
              </div>
            </div>
        )}
      </div>
  );
};

export default MovieListPage;
