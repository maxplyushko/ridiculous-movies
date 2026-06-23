import { useCallback, useEffect, useRef, useState } from "react";
import type { MovieGroup } from "../types/MovieGroup.ts";
import type { Movie } from "../types/Movie.ts";
import MovieItem from "./MovieItem.tsx";
import { CirclePlus, Search, X } from "lucide-react";
import AddMoviePage from "./AddMoviePage.tsx";
import { deleteMovie, fetchMovieGroups } from "../api/movies.ts";
import { PageLoader } from "./PageLoader.tsx";

type RoundSectionProps = {
  movieGroup: MovieGroup;
  currentRound: number;
  expandedId: string | null;
  openSwipeId: string | null;
  isAdmin: boolean;
  onAddMovie: () => void;
  onToggle: (id: string) => void;
  onEdit: (movie: Movie) => void;
  onDelete: (movie: Movie) => void;
  onSwipeOpen: (id: string) => void;
  onSwipeClose: (id: string) => void;
  onSwipeBegin: (id: string) => void;
};

function RoundSection({
  movieGroup,
  currentRound,
  expandedId,
  openSwipeId,
  isAdmin,
  onAddMovie,
  onToggle,
  onEdit,
  onDelete,
  onSwipeOpen,
  onSwipeClose,
  onSwipeBegin,
}: Readonly<RoundSectionProps>) {
  return (
    <div className="movie-group">
      <div className="movie-group__header">
        <div className="movie-group__header__round">
          <h3>Round {movieGroup.groupId}</h3>
        </div>
        <div className="movie-group__header__actions">
          {movieGroup.groupId === currentRound && (
            <button className="icon-button" onClick={onAddMovie} aria-label="Add movie">
              <CirclePlus size={30} />
            </button>
          )}
        </div>
      </div>
      {movieGroup.movies.map((movie) => (
        <MovieItem
          key={movie.id}
          movie={movie}
          isExpanded={expandedId === movie.id}
          isSwipeOpen={openSwipeId === movie.id}
          canDelete={isAdmin}
          onToggle={() => onToggle(movie.id)}
          onEdit={onEdit}
          onDelete={onDelete}
          onSwipeOpen={() => onSwipeOpen(movie.id)}
          onSwipeClose={() => onSwipeClose(movie.id)}
          onSwipeBegin={() => onSwipeBegin(movie.id)}
        />
      ))}
    </div>
  );
}

type ConfirmDeleteDialogProps = {
  movie: Movie;
  error: string | null;
  onConfirm: () => void;
  onCancel: () => void;
};

function ConfirmDeleteDialog({ movie, error, onConfirm, onCancel }: Readonly<ConfirmDeleteDialogProps>) {
  return (
    <div className="confirm-dialog-overlay">
      <div className="confirm-dialog">
        <p>Delete "{movie.title}"?</p>
        {error && <span className="confirm-dialog__error">{error}</span>}
        <div className="confirm-dialog__actions">
          <button type="button" onClick={onCancel}>Cancel</button>
          <button type="button" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
}

const MovieListPage = ({ isAdmin }: { isAdmin: boolean }) => {
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
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  const loadMovieGroups = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchMovieGroups({ sort: "desc" })
      .then((data) => {
        setMovieGroups(data.groups);
        setCurrentRound(data.currentRound);
      })
      .catch((err) => setError(err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    queueMicrotask(loadMovieGroups);
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

  const cancelDelete = () => {
    setMovieToDelete(null);
    setDeleteError(null);
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

  const normalizedQuery = searchQuery.toLowerCase().trim();
  const visibleGroups = normalizedQuery
    ? movieGroups
        .map((g) => ({
          ...g,
          movies: g.movies.filter(
            (m) =>
              m.title.toLowerCase().includes(normalizedQuery) ||
              m.description.toLowerCase().includes(normalizedQuery),
          ),
        }))
        .filter((g) => g.movies.length > 0)
    : movieGroups;

  if (isLoading) return <PageLoader />;
  if (error) {
    console.error(error);
    return <p>Error: {error.message}</p>;
  }

  return (
    <div>
      <div className="movie-list__search-bar">
        <div className="movie-list__search">
          <Search size={18} className="movie-list__search__icon" />
          <input
            ref={searchInputRef}
            type="search"
            inputMode="search"
            placeholder="Search by title or description…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="movie-list__search__clear" onClick={() => setSearchQuery("")} aria-label="Clear search">
              <X size={18} />
            </button>
          )}
        </div>
      </div>
      <div className="movie-list">
        {normalizedQuery && visibleGroups.length === 0 && (
          <p className="movie-list__no-results">No movies match "{searchQuery}"</p>
        )}
        {visibleGroups.map((group) => (
          <RoundSection
            key={group.groupId}
            movieGroup={group}
            currentRound={currentRound}
            expandedId={expandedId}
            openSwipeId={openSwipeId}
            isAdmin={isAdmin}
            onAddMovie={() => { setEditingMovie(undefined); setShowMovieForm(true); }}
            onToggle={(id) => { setOpenSwipeId(null); setExpandedId(expandedId === id ? null : id); }}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onSwipeOpen={(id) => setOpenSwipeId(id)}
            onSwipeClose={(id) => setOpenSwipeId((cur) => cur === id ? null : cur)}
            onSwipeBegin={(id) => { if (openSwipeId !== null && openSwipeId !== id) setOpenSwipeId(null); }}
          />
        ))}
      </div>
      {showMovieForm && (
        <div className="movie-list__add__movie">
          <AddMoviePage
            key={editingMovie?.id ?? "new"}
            currentRound={currentRound}
            movie={editingMovie}
            onBack={closeMovieForm}
          />
        </div>
      )}
      {movieToDelete && (
        <ConfirmDeleteDialog
          movie={movieToDelete}
          error={deleteError}
          onConfirm={executeDelete}
          onCancel={cancelDelete}
        />
      )}
    </div>
  );
};

export default MovieListPage;
