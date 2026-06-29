import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import confetti from "canvas-confetti";
import type { PersonalMovie } from "../types/PersonalMovie.ts";
import PersonalMovieItem from "./PersonalMovieItem.tsx";
import AddPersonalMoviePage from "./AddPersonalMoviePage.tsx";
import { Eye, EyeDashed, Loader, Plus, Search, X } from "lucide-react";
import { RatingModal } from "./RatingModal.tsx";
import { useSpinPicker } from "../hooks/useSpinPicker.ts";
import { addPersonalMovie, deletePersonalMovie, editPersonalMovie, fetchPersonalList } from "../api/personalList.ts";
import { MovieListSkeleton } from "./MovieListSkeleton.tsx";
import { hapticSpinReveal, hapticTabTap } from "../haptics.ts";
import { useSwipeBack } from "../hooks/useSwipeBack.ts";
import TmdbSearchSection from "./TmdbSearchSection.tsx";


type ConfirmDeleteDialogProps = {
  movie: PersonalMovie;
  error: string | null;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

function ConfirmDeleteDialog({ movie, error, isDeleting, onConfirm, onCancel }: Readonly<ConfirmDeleteDialogProps>) {
  const { t } = useTranslation();
  return (
    <div className="confirm-dialog-overlay">
      <div className="confirm-dialog">
        <p>{t('personalList.confirmDelete', { title: movie.title })}</p>
        {error && <span className="confirm-dialog__error">{error}</span>}
        <div className="confirm-dialog__actions">
          <button type="button" onClick={onCancel} disabled={isDeleting}>{t('personalList.btnCancel')}</button>
          <button type="button" onClick={onConfirm} disabled={isDeleting}>
            {isDeleting ? <Loader size={14} className="tmdb-section__spinner" /> : t('personalList.btnDelete')}
          </button>
        </div>
      </div>
    </div>
  );
}


function FireworkSparks() {
  return (
    <div className="misc-page__fireworks" aria-hidden="true">
      {Array.from({ length: 16 }, (_, i) => (
        <span key={i} className="misc-page__firework-spark" style={{ "--i": i } as React.CSSProperties} />
      ))}
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
  const { t } = useTranslation();
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
  const moviePicker = useSpinPicker<string>();

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
          <button
            type="button"
            className="mlp__card"
            disabled={moviePicker.spinning || toWatch.length === 0}
            onClick={() => {
              if (toWatch.length === 0 || moviePicker.spinning) return;
              hapticTabTap();
              moviePicker.spin(() => toWatch[Math.floor(Math.random() * toWatch.length)].title);
            }}
          >
            {moviePicker.spinning
              ? <Loader size={20} className="mlp__card-icon tmdb-section__spinner" />
              : <EyeDashed size={20} className="mlp__card-icon" />}
            <span className="mlp__card-value">{movies.filter((m) => !m.watched).length}</span>
            <span className="mlp__card-label">{t('personalList.labelToWatch')}</span>
          </button>
          <div className="mlp__card">
            <Eye size={20} className="mlp__card-icon" />
            <span className="mlp__card-value">{movies.filter((m) => m.watched).length}</span>
            <span className="mlp__card-label">{t('personalList.labelWatched')}</span>
          </div>
          <button
            type="button"
            className="mlp__card mlp__card--accent"
            onClick={() => { hapticTabTap(); setEditingMovie(undefined); setShowForm(true); }}
          >
            <span className="mlp__card-row-spacer" aria-hidden="true" />
            <Plus size={20} className="mlp__card-icon" />
            <span className="mlp__card-label">{t('personalList.btnAddMovie')}</span>
          </button>
        </div>
      </div>

      <div className="mlp__search-bar">
        <div className="mlp__search">
          <Search size={18} className="mlp__search-icon" />
          <input
            type="search"
            inputMode="search"
            placeholder={t('personalList.placeholderSearch')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="mlp__search-clear" onClick={() => setSearchQuery("")} aria-label={t('personalList.placeholderSearch')}>
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      <div className="movie-list">
        {normalizedQuery && toWatch.length === 0 && watched.length === 0 && !showTmdb && (
          <p className="movie-list__no-results">{t('personalList.noMatch')} "{searchQuery}"</p>
        )}
        {showTmdb && (toWatch.length > 0 || watched.length > 0) && (
          <div className="movie-group__header"><h3>{t('personalList.sectionInYourList')}</h3></div>
        )}
        <PersonalSection
          title={t('personalList.sectionToWatch')}
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
          title={t('personalList.sectionWatched')}
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
          <p className="movie-list__no-results">{t('personalList.empty')}</p>
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
      {moviePicker.result && (
        <div className="confirm-dialog-overlay" onClick={moviePicker.clear}>
          <div className="confirm-dialog" style={{ position: "relative", overflow: "visible" }} onClick={(e) => e.stopPropagation()}>
            <FireworkSparks key={moviePicker.result} />
            <p><strong>{moviePicker.result}</strong></p>
            <div className="confirm-dialog__actions">
              <button type="button" onClick={moviePicker.clear}>OK</button>
            </div>
          </div>
        </div>
      )}
      {ratingMovie && (
        <RatingModal
          title={t('personalList.rateDialog', { title: ratingMovie.title })}
          initialScore={ratingMovie.rating}
          defaultMode="classic"
          cancelLabel={t('personalList.btnSkip')}
          saveLabel={t('personalList.btnSave')}
          onCancel={() => {
            const movie = ratingMovie;
            setRatingMovie(null);
            applyToggle(movie);
            celebrate(movie.id);
          }}
          onSave={async (rating) => {
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
