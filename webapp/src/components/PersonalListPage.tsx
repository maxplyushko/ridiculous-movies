import { useCallback, useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";
import type { PersonalMovie } from "../types/PersonalMovie.ts";
import PersonalMovieItem from "./PersonalMovieItem.tsx";
import AddPersonalMoviePage from "./AddPersonalMoviePage.tsx";
import { Eye, EyeDashed, Loader, Plus, Search, Star, X } from "lucide-react";
import { addPersonalMovie, deletePersonalMovie, editPersonalMovie, fetchPersonalList } from "../api/personalList.ts";
import { MovieListSkeleton } from "./MovieListSkeleton.tsx";
import { hapticSpinReveal, hapticTabTap } from "../haptics.ts";
import { useSwipeBack } from "../hooks/useSwipeBack.ts";
import TmdbSearchSection from "./TmdbSearchSection.tsx";

const SCORE_MIN = 1;
const SCORE_MAX = 10;
const SCORE_STEP = 0.25;
const TICK_LABELS = Array.from({ length: SCORE_MAX - SCORE_MIN + 1 }, (_, i) => i + SCORE_MIN);

type ConfirmDeleteDialogProps = {
  movie: PersonalMovie;
  error: string | null;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

function ConfirmDeleteDialog({ movie, error, isDeleting, onConfirm, onCancel }: Readonly<ConfirmDeleteDialogProps>) {
  return (
    <div className="confirm-dialog-overlay">
      <div className="confirm-dialog">
        <p>Delete "{movie.title}"?</p>
        {error && <span className="confirm-dialog__error">{error}</span>}
        <div className="confirm-dialog__actions">
          <button type="button" onClick={onCancel} disabled={isDeleting}>Cancel</button>
          <button type="button" onClick={onConfirm} disabled={isDeleting}>
            {isDeleting ? <Loader size={14} className="tmdb-section__spinner" /> : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

type RatingDialogProps = {
  movie: PersonalMovie;
  onSkip: () => void;
  onSave: (rating: number) => void;
};

function RatingDialog({ movie, onSkip, onSave }: Readonly<RatingDialogProps>) {
  const [rating, setRating] = useState<number>(movie.rating ?? 7);
  return (
    <div className="confirm-dialog-overlay">
      <div className="confirm-dialog personal-rating-dialog">
        <p>Rate "{movie.title}"</p>
        <div className="personal-rating-dialog__slider-area">
          <span className="personal-rating-dialog__value">
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

type PersonalSectionProps = {
  title: string;
  movies: PersonalMovie[];
  openSwipeId: string | null;
  expandedId: string | null;
  celebratingId: string | null;
  onEdit: (movie: PersonalMovie) => void;
  onDelete: (movie: PersonalMovie) => void;
  onToggleWatched: (movie: PersonalMovie) => void;
  onToggle: (id: string) => void;
  onSwipeOpen: (id: string) => void;
  onSwipeClose: (id: string) => void;
  onSwipeBegin: (id: string) => void;
};

function PersonalSection({
  title,
  movies,
  openSwipeId,
  expandedId,
  celebratingId,
  onEdit,
  onDelete,
  onToggleWatched,
  onToggle,
  onSwipeOpen,
  onSwipeClose,
  onSwipeBegin,
}: Readonly<PersonalSectionProps>) {
  if (movies.length === 0) return null;
  return (
    <div className="movie-group">
      <div className="movie-group__header">
        <h3>{title}</h3>
      </div>
      {movies.map((movie) => (
        <PersonalMovieItem
          key={movie.id}
          movie={movie}
          isExpanded={expandedId === movie.id}
          isSwipeOpen={openSwipeId === movie.id}
          isCelebrating={celebratingId === movie.id}
          onToggle={() => onToggle(movie.id)}
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

const PersonalListPage = () => {
  const [movies, setMovies] = useState<PersonalMovie[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingMovie, setEditingMovie] = useState<PersonalMovie | undefined>(undefined);
  const [movieToDelete, setMovieToDelete] = useState<PersonalMovie | null>(null);
  const [ratingMovie, setRatingMovie] = useState<PersonalMovie | null>(null);
  const [celebratingId, setCelebratingId] = useState<string | null>(null);
  const [openSwipeId, setOpenSwipeId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [formEl, setFormEl] = useState<HTMLDivElement | null>(null);
  const toggleVersionRef = useRef<Map<string, number>>(new Map());

  const loadMovies = useCallback((silent?: boolean) => {
    if (!silent) setLoading(true);
    setError(null);
    fetchPersonalList()
      .then(setMovies)
      .catch((err) => { if (!silent) setError(err); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    queueMicrotask(loadMovies);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const closeForm = () => {
    setShowForm(false);
    setEditingMovie(undefined);
    loadMovies();
  };

  useSwipeBack(closeForm, formEl);

  useEffect(() => {
    if (openSwipeId === null) return;
    const close = (e: TouchEvent) => {
      if (!(e.target as HTMLElement).closest('.movie-item-wrapper')) {
        setOpenSwipeId(null);
      }
    };
    document.addEventListener('touchstart', close, { passive: true });
    return () => document.removeEventListener('touchstart', close);
  }, [openSwipeId]);

  const handleEdit = (movie: PersonalMovie) => {
    setOpenSwipeId(null);
    setEditingMovie(movie);
    setShowForm(true);
  };

  const handleDelete = (movie: PersonalMovie) => {
    setDeleteError(null);
    setMovieToDelete(movie);
  };

  const cancelDelete = () => {
    setMovieToDelete(null);
    setDeleteError(null);
    setIsDeleting(false);
  };

  const executeDelete = async () => {
    if (!movieToDelete) return;
    hapticTabTap();
    setIsDeleting(true);
    try {
      await deletePersonalMovie(movieToDelete.id);
      setMovieToDelete(null);
      setDeleteError(null);
      setIsDeleting(false);
      loadMovies();
    } catch (err) {
      setIsDeleting(false);
      setDeleteError(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  const applyToggle = async (movie: PersonalMovie, rating?: number) => {
    const payload = {
      title: movie.title,
      description: movie.description,
      rating: rating !== undefined ? rating : movie.rating,
      watched: !movie.watched,
    };
    const version = (toggleVersionRef.current.get(movie.id) ?? 0) + 1;
    toggleVersionRef.current.set(movie.id, version);
    const isCurrent = () => toggleVersionRef.current.get(movie.id) === version;

    setMovies((prev) => prev.map((m) => m.id === movie.id ? { ...movie, ...payload } : m));
    try {
      const updated = await editPersonalMovie(movie.id, payload);
      if (isCurrent()) setMovies((prev) => prev.map((m) => m.id === updated.id ? updated : m));
    } catch (err) {
      if (isCurrent()) setMovies((prev) => prev.map((m) => m.id === movie.id ? movie : m));
      console.error(err);
    }
  };

  const celebrate = (movieId: string) => {
    hapticSpinReveal();
    fireWatchedCelebration();
    setCelebratingId(movieId);
    setTimeout(() => setCelebratingId(null), 500);
  };

  const handleToggleWatched = (movie: PersonalMovie) => {
    if (movie.watched) {
      applyToggle(movie);
    } else {
      setRatingMovie(movie);
    }
  };

  const showTmdb = searchQuery.trim().length >= 3;

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
    <div className="mlp" onClick={() => { if (openSwipeId !== null) setOpenSwipeId(null); }}>
      <div className="mlp__hero">
        <div className="mlp__cards">
          <div className="mlp__card">
            <EyeDashed size={20} className="mlp__card-icon" />
            <span className="mlp__card-value">{movies.filter((m) => !m.watched).length}</span>
            <span className="mlp__card-label">To Watch</span>
          </div>
          <div className="mlp__card">
            <Eye size={20} className="mlp__card-icon" />
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
            placeholder="Search movies…"
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

      <div className="movie-list">
        {normalizedQuery && toWatch.length === 0 && watched.length === 0 && !showTmdb && (
          <p className="movie-list__no-results">No movies match "{searchQuery}"</p>
        )}
        {showTmdb && (toWatch.length > 0 || watched.length > 0) && (
          <div className="movie-group__header"><h3>In your personal list</h3></div>
        )}
        <PersonalSection
          title="To Watch"
          movies={toWatch}
          openSwipeId={openSwipeId}
          celebratingId={celebratingId}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onToggleWatched={handleToggleWatched}
          expandedId={expandedId}
          onToggle={(id) => { setOpenSwipeId(null); setExpandedId(expandedId === id ? null : id); }}
          onSwipeOpen={(id) => setOpenSwipeId(id)}
          onSwipeClose={(id) => setOpenSwipeId((cur) => (cur === id ? null : cur))}
          onSwipeBegin={(id) => { if (openSwipeId !== null && openSwipeId !== id) setOpenSwipeId(null); }}
        />
        <PersonalSection
          title="Watched"
          movies={watched}
          openSwipeId={openSwipeId}
          celebratingId={celebratingId}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onToggleWatched={handleToggleWatched}
          expandedId={expandedId}
          onToggle={(id) => { setOpenSwipeId(null); setExpandedId(expandedId === id ? null : id); }}
          onSwipeOpen={(id) => setOpenSwipeId(id)}
          onSwipeClose={(id) => setOpenSwipeId((cur) => (cur === id ? null : cur))}
          onSwipeBegin={(id) => { if (openSwipeId !== null && openSwipeId !== id) setOpenSwipeId(null); }}
        />
        {movies.length === 0 && !normalizedQuery && (
          <p className="movie-list__no-results">Your personal list is empty. Add something!</p>
        )}
        {showTmdb && (
          <TmdbSearchSection
            query={searchQuery}
            onAddToPersonalList={(m) => addPersonalMovie({ title: m.title, description: m.overview ?? "", rating: null }).then((added) => setMovies((prev) => [added, ...prev]))}
          />
        )}
      </div>

      {showForm && (
        <div className="movie-list__add__movie" ref={setFormEl}>
          <AddPersonalMoviePage
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
          isDeleting={isDeleting}
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

export default PersonalListPage;
