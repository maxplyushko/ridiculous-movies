import { useCallback, useEffect, useState } from "react";
import confetti from "canvas-confetti";
import type { WatchlistMovie } from "../types/WatchlistMovie.ts";
import WatchlistMovieItem from "./WatchlistMovieItem.tsx";
import AddWatchlistMoviePage from "./AddWatchlistMoviePage.tsx";
import { Bookmark, BookmarkCheck, Plus, Search, Star, X } from "lucide-react";
import { deleteWatchlistMovie, editWatchlistMovie, fetchWatchlist } from "../api/watchlist.ts";
import { MovieListSkeleton } from "./MovieListSkeleton.tsx";
import { hapticSpinReveal, hapticTabTap } from "../haptics.ts";
import { useSwipeBack } from "../hooks/useSwipeBack.ts";

const SCORE_MIN = 1;
const SCORE_MAX = 10;
const SCORE_STEP = 0.25;
const TICK_LABELS = Array.from({ length: SCORE_MAX - SCORE_MIN + 1 }, (_, i) => i + SCORE_MIN);

type ConfirmDeleteDialogProps = {
  movie: WatchlistMovie;
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

type RatingDialogProps = {
  movie: WatchlistMovie;
  onSkip: () => void;
  onSave: (rating: number) => void;
};

function RatingDialog({ movie, onSkip, onSave }: Readonly<RatingDialogProps>) {
  const [rating, setRating] = useState<number>(movie.rating ?? 7);
  return (
    <div className="confirm-dialog-overlay">
      <div className="confirm-dialog watchlist-rating-dialog">
        <p>Rate "{movie.title}"</p>
        <div className="watchlist-rating-dialog__slider-area">
          <span className="watchlist-rating-dialog__value">
            {rating.toFixed(2)}<Star size={14} />
          </span>
          <input
            type="range"
            className="rating-card__slider"
            min={SCORE_MIN}
            max={SCORE_MAX}
            step={SCORE_STEP}
            value={rating}
            onChange={(e) => setRating(parseFloat(e.target.value))}
            aria-label="Rating"
          />
          <div className="rating-card__ticks">
            {TICK_LABELS.map((t) => <span key={t}>{t}</span>)}
          </div>
        </div>
        <div className="confirm-dialog__actions">
          <button type="button" onClick={() => { hapticTabTap(); onSkip(); }}>Skip</button>
          <button type="button" onClick={() => { hapticTabTap(); onSave(rating); }}>Save</button>
        </div>
      </div>
    </div>
  );
}

const CELEBRATION_COLORS = ["#ffd60a", "#ff9f0a", "#30d158", "#3390ec", "#ff375f", "#bf5af2"];

function fireWatchedCelebration() {
  const defaults = { origin: { x: 0.5, y: 0.5 }, colors: CELEBRATION_COLORS, disableForReducedMotion: true };
  confetti({ ...defaults, particleCount: 25, spread: 360, startVelocity: 22, ticks: 60, scalar: 0.75, shapes: ["star" as const] });
  confetti({ ...defaults, particleCount: 15, spread: 360, startVelocity: 36, ticks: 50, scalar: 0.55 });
}

type WatchlistSectionProps = {
  title: string;
  movies: WatchlistMovie[];
  openSwipeId: string | null;
  celebratingId: string | null;
  onEdit: (movie: WatchlistMovie) => void;
  onDelete: (movie: WatchlistMovie) => void;
  onToggleWatched: (movie: WatchlistMovie) => void;
  onSwipeOpen: (id: string) => void;
  onSwipeClose: (id: string) => void;
  onSwipeBegin: (id: string) => void;
};

function WatchlistSection({
  title,
  movies,
  openSwipeId,
  celebratingId,
  onEdit,
  onDelete,
  onToggleWatched,
  onSwipeOpen,
  onSwipeClose,
  onSwipeBegin,
}: Readonly<WatchlistSectionProps>) {
  if (movies.length === 0) return null;
  return (
    <div className="movie-group">
      <div className="movie-group__header">
        <h3>{title}</h3>
      </div>
      {movies.map((movie) => (
        <WatchlistMovieItem
          key={movie.id}
          movie={movie}
          isSwipeOpen={openSwipeId === movie.id}
          isCelebrating={celebratingId === movie.id}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggleWatched={onToggleWatched}
          onSwipeOpen={() => onSwipeOpen(movie.id)}
          onSwipeClose={() => onSwipeClose(movie.id)}
          onSwipeBegin={() => onSwipeBegin(movie.id)}
        />
      ))}
    </div>
  );
}

const WatchlistPage = () => {
  const [movies, setMovies] = useState<WatchlistMovie[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingMovie, setEditingMovie] = useState<WatchlistMovie | undefined>(undefined);
  const [movieToDelete, setMovieToDelete] = useState<WatchlistMovie | null>(null);
  const [ratingMovie, setRatingMovie] = useState<WatchlistMovie | null>(null);
  const [celebratingId, setCelebratingId] = useState<string | null>(null);
  const [openSwipeId, setOpenSwipeId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [formEl, setFormEl] = useState<HTMLDivElement | null>(null);

  const loadMovies = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchWatchlist()
      .then(setMovies)
      .catch((err) => setError(err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    queueMicrotask(loadMovies);
  }, [loadMovies]);

  const closeForm = () => {
    setShowForm(false);
    setEditingMovie(undefined);
    loadMovies();
  };

  useSwipeBack(closeForm, formEl);

  const handleEdit = (movie: WatchlistMovie) => {
    setOpenSwipeId(null);
    setEditingMovie(movie);
    setShowForm(true);
  };

  const handleDelete = (movie: WatchlistMovie) => {
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
      await deleteWatchlistMovie(movieToDelete.id);
      setMovieToDelete(null);
      setDeleteError(null);
      loadMovies();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  const applyToggle = async (movie: WatchlistMovie, rating?: number) => {
    try {
      const updated = await editWatchlistMovie(movie.id, {
        title: movie.title,
        description: movie.description,
        rating: rating !== undefined ? rating : movie.rating,
        watched: !movie.watched,
      });
      setMovies((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
    } catch (err) {
      console.error(err);
    }
  };

  const celebrate = (movieId: string) => {
    hapticSpinReveal();
    fireWatchedCelebration();
    setCelebratingId(movieId);
    setTimeout(() => setCelebratingId(null), 500);
  };

  const handleToggleWatched = (movie: WatchlistMovie) => {
    if (movie.watched) {
      applyToggle(movie);
    } else {
      setRatingMovie(movie);
    }
  };

  const normalizedQuery = searchQuery.toLowerCase().trim();
  const filtered = normalizedQuery
    ? movies.filter(
        (m) =>
          m.title.toLowerCase().includes(normalizedQuery) ||
          m.description.toLowerCase().includes(normalizedQuery),
      )
    : movies;

  const toWatch = filtered.filter((m) => !m.watched);
  const watched = filtered.filter((m) => m.watched);

  if (isLoading) return <MovieListSkeleton />;
  if (error) {
    console.error(error);
    return <p>Error: {error.message}</p>;
  }

  return (
    <div className="mlp">
      <div className="mlp__hero">
        <div className="mlp__cards">
          <div className="mlp__card">
            <Bookmark size={20} className="mlp__card-icon" />
            <span className="mlp__card-value">{movies.filter((m) => !m.watched).length}</span>
            <span className="mlp__card-label">To Watch</span>
          </div>
          <div className="mlp__card">
            <BookmarkCheck size={20} className="mlp__card-icon" />
            <span className="mlp__card-value">{movies.filter((m) => m.watched).length}</span>
            <span className="mlp__card-label">Watched</span>
          </div>
          <button
            type="button"
            className="mlp__card mlp__card--action"
            onClick={() => { hapticTabTap(); setEditingMovie(undefined); setShowForm(true); }}
          >
            <Plus size={26} className="mlp__card-icon" />
            <span className="mlp__card-label">Add movie</span>
          </button>
        </div>
      </div>

      <div className="mlp__search-bar">
        <div className="mlp__search">
          <Search size={18} className="mlp__search-icon" />
          <input
            type="search"
            inputMode="search"
            placeholder="Search watchlist…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="mlp__search-clear" onClick={() => setSearchQuery("")} aria-label="Clear search">
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      <div className="movie-list" onClick={() => { if (openSwipeId !== null) setOpenSwipeId(null); }}>
        {normalizedQuery && toWatch.length === 0 && watched.length === 0 && (
          <p className="movie-list__no-results">No movies match "{searchQuery}"</p>
        )}
        <WatchlistSection
          title="To Watch"
          movies={toWatch}
          openSwipeId={openSwipeId}
          celebratingId={celebratingId}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onToggleWatched={handleToggleWatched}
          onSwipeOpen={(id) => setOpenSwipeId(id)}
          onSwipeClose={(id) => setOpenSwipeId((cur) => (cur === id ? null : cur))}
          onSwipeBegin={(id) => { if (openSwipeId !== null && openSwipeId !== id) setOpenSwipeId(null); }}
        />
        <WatchlistSection
          title="Watched"
          movies={watched}
          openSwipeId={openSwipeId}
          celebratingId={celebratingId}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onToggleWatched={handleToggleWatched}
          onSwipeOpen={(id) => setOpenSwipeId(id)}
          onSwipeClose={(id) => setOpenSwipeId((cur) => (cur === id ? null : cur))}
          onSwipeBegin={(id) => { if (openSwipeId !== null && openSwipeId !== id) setOpenSwipeId(null); }}
        />
        {movies.length === 0 && !normalizedQuery && (
          <p className="movie-list__no-results">Your watchlist is empty. Add something!</p>
        )}
      </div>

      {showForm && (
        <div className="movie-list__add__movie" ref={setFormEl}>
          <AddWatchlistMoviePage
            key={editingMovie?.id ?? "new"}
            movie={editingMovie}
            onBack={closeForm}
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
      {ratingMovie && (
        <RatingDialog
          movie={ratingMovie}
          onSkip={() => {
            const movie = ratingMovie;
            setRatingMovie(null);
            applyToggle(movie);
            celebrate(movie.id);
          }}
          onSave={(rating) => {
            const movie = ratingMovie;
            setRatingMovie(null);
            applyToggle(movie, rating);
            celebrate(movie.id);
          }}
        />
      )}
    </div>
  );
};

export default WatchlistPage;
