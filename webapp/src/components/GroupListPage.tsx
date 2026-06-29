import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import * as Slider from "@radix-ui/react-slider";
import confetti from "canvas-confetti";
import type { MovieGroup } from "../types/MovieGroup.ts";
import type { Movie } from "../types/Movie.ts";
import type { User } from "../types/User.ts";
import MovieItem from "./MovieItem.tsx";
import TmdbSearchSection from "./TmdbSearchSection.tsx";
import { Clapperboard, Loader, Plus, Search, Trophy, X } from "lucide-react";
import AddMoviePage from "./AddMoviePage.tsx";
import { deleteMovie, fetchMovieGroups } from "../api/movies.ts";
import { fetchUsers } from "../api/users.ts";
import { MovieListSkeleton } from "./MovieListSkeleton.tsx";
import { hapticSpinReveal, hapticSpinStart, hapticSpinTick, hapticTabTap, stopHaptics } from "../haptics.ts";
import { useSwipeBack } from "../hooks/useSwipeBack.ts";
import { useSpinPicker } from "../hooks/useSpinPicker.ts";

type RoundSectionProps = {
  movieGroup: MovieGroup;
  expandedId: string | null;
  openSwipeId: string | null;
  isAdmin: boolean;
  onToggle: (id: string) => void;
  onEdit: (movie: Movie) => void;
  onDelete: (movie: Movie) => void;
  onSwipeOpen: (id: string) => void;
  onSwipeClose: (id: string) => void;
  onSwipeBegin: (id: string) => void;
};

function RoundSection({
  movieGroup,
  expandedId,
  openSwipeId,
  isAdmin,
  onToggle,
  onEdit,
  onDelete,
  onSwipeOpen,
  onSwipeClose,
  onSwipeBegin,
}: Readonly<RoundSectionProps>) {
  const { t } = useTranslation();
  return (
    <div className="movie-group">
      <div className="movie-group__header">
        <div className="movie-group__header__round">
          <h3>{t('groupList.labelRound')} {movieGroup.groupId}</h3>
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
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

function FireworkSparks() {
  return (
    <div className="misc-page__fireworks" aria-hidden="true">
      {Array.from({ length: 16 }, (_, i) => (
        <span key={i} className="misc-page__firework-spark" style={{ "--i": i } as React.CSSProperties} />
      ))}
    </div>
  );
}

function ConfirmDeleteDialog({ movie, error, isDeleting, onConfirm, onCancel }: Readonly<ConfirmDeleteDialogProps>) {
  const { t } = useTranslation();
  return (
    <div className="confirm-dialog-overlay">
      <div className="confirm-dialog">
        <p>{t('groupList.confirmDelete', { title: movie.title })}</p>
        {error && <span className="confirm-dialog__error">{error}</span>}
        <div className="confirm-dialog__actions">
          <button type="button" onClick={onCancel} disabled={isDeleting}>{t('groupList.btnCancel')}</button>
          <button type="button" onClick={onConfirm} disabled={isDeleting}>
            {isDeleting ? <Loader size={14} className="tmdb-section__spinner" /> : t('groupList.btnDelete')}
          </button>
        </div>
      </div>
    </div>
  );
}

const NP_TICK_MS = 65;
const NP_TICK_COUNT = 20;

function NumberPickerDialog({ sliderMax, onClose }: Readonly<{ sliderMax: number; onClose: () => void }>) {
  const { t } = useTranslation();
  const [npMin, setNpMin] = useState(1);
  const [npMax, setNpMax] = useState(sliderMax);
  const [display, setDisplay] = useState<number | null>(null);
  const [final, setFinal] = useState<number | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [resultKey, setResultKey] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  useEffect(() => () => { clearInterval(intervalRef.current); stopHaptics(); }, []);

  useEffect(() => {
    if (final === null || spinning) return;
    confetti({
      origin: { x: 0.5, y: 0.5 },
      particleCount: 80,
      spread: 360,
      startVelocity: 30,
      ticks: 80,
      scalar: 0.9,
      colors: ["#3390ec", "#ff9500", "#ff3b30", "#34c759", "#ffd60a", "#bf5af2"],
      disableForReducedMotion: true,
    });
  }, [resultKey, final, spinning]);

  const resetResult = () => {
    clearInterval(intervalRef.current);
    stopHaptics();
    setSpinning(false);
    setDisplay(null);
    setFinal(null);
  };

  const pick = () => {
    if (spinning) return;
    hapticTabTap();
    const range = npMax - npMin + 1;
    const chosen = npMin + Math.floor(Math.random() * range);
    hapticSpinStart();
    setSpinning(true);
    setFinal(null);
    setDisplay(npMin + Math.floor(Math.random() * range));
    let ticks = 0;
    intervalRef.current = setInterval(() => {
      ticks++;
      setDisplay(npMin + Math.floor(Math.random() * range));
      hapticSpinTick();
      if (ticks >= NP_TICK_COUNT) {
        clearInterval(intervalRef.current);
        intervalRef.current = undefined;
        stopHaptics();
        setSpinning(false);
        setDisplay(chosen);
        setFinal(chosen);
        setResultKey((k) => k + 1);
        hapticSpinReveal();
      }
    }, NP_TICK_MS);
  };

  return (
    <div className="confirm-dialog-overlay" onClick={onClose}>
      <div className="confirm-dialog mlp__number-picker" onClick={(e) => e.stopPropagation()}>
        <div className="mlp__picker-title">{t('groupList.dialogRandomizerTitle')}</div>
        <div className="mlp__range-wrap">
          <div className="mlp__range-labels">
            <span className="mlp__range-value">{npMin}</span>
            <span className="mlp__range-value">{npMax}</span>
          </div>
          <Slider.Root
            className="mlp__range-root"
            min={1}
            max={sliderMax}
            step={1}
            value={[npMin, npMax]}
            onValueChange={([min, max]) => { setNpMin(min); setNpMax(max); resetResult(); }}
          >
            <Slider.Track className="mlp__range-track">
              <Slider.Range className="mlp__range-range" />
            </Slider.Track>
            <Slider.Thumb className="mlp__range-thumb" />
            <Slider.Thumb className="mlp__range-thumb" />
          </Slider.Root>
        </div>
        {display !== null && (
          <div className="misc-page__result misc-page__result--inline">
            {!spinning && final !== null && <FireworkSparks key={resultKey} />}
            <span className="misc-page__result-label">{spinning ? t('groupList.labelPicking') : t('groupList.labelYourNumber')}</span>
            <span
              key={spinning ? `spin-${display}` : `result-${resultKey}`}
              className={`misc-page__result-number${spinning ? " misc-page__result-number--spinning" : ""}`}
            >
              {display}
            </span>
          </div>
        )}
        <div className="mlp__action-row" style={{ marginTop: display !== null ? 0 : "0.5rem" }}>
          <button
            type="button"
            className="misc-page__generate"
            disabled={spinning}
            onClick={pick}
          >
            {spinning ? t('groupList.btnQuantumizing') : t('groupList.btnGenerate')}
          </button>
          {final !== null && !spinning && (
            <button type="button" className="mlp__result-ok" onClick={() => { hapticTabTap(); onClose(); }}>{t('groupList.btnOk')}</button>
          )}
        </div>
      </div>
    </div>
  );
}

const GroupListPage = ({ isAdmin }: { isAdmin: boolean }) => {
  const { t } = useTranslation();
  const [movieGroups, setMovieGroups] = useState<MovieGroup[]>([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [maxRound, setMaxRound] = useState(0);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showMovieForm, setShowMovieForm] = useState(false);
  const [editingMovie, setEditingMovie] = useState<Movie | undefined>(undefined);
  const [movieToDelete, setMovieToDelete] = useState<Movie | null>(null);
  const [openSwipeId, setOpenSwipeId] = useState<string | null>(null);
  useEffect(() => {
    if (openSwipeId === null) return;
    const close = () => setOpenSwipeId(null);
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [openSwipeId]);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [addMovieEl, setAddMovieEl] = useState<HTMLDivElement | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [npOpen, setNpOpen] = useState(false);
  const [npSliderMax, setNpSliderMax] = useState(10);

  const hostPicker = useSpinPicker<string>();

  const ensureUsers = async (): Promise<User[]> => {
    if (users.length > 0) return users;
    try {
      const pool = await fetchUsers();
      setUsers(pool);
      return pool;
    } catch {
      return [];
    }
  };

  const pickHost = async () => {
    if (hostPicker.spinning) return;
    hapticTabTap();
    const pool = await ensureUsers();
    if (pool.length === 0) return;

    const currentGroup = movieGroups.find((g) => g.groupId === currentRound);
    const hostedIds = new Set(currentGroup?.movies.map((m) => m.owner.id) ?? []);
    const remaining = pool.filter((u) => !hostedIds.has(u.id));
    const candidates = remaining.length > 0 ? remaining : pool;

    hostPicker.spin(() => candidates[Math.floor(Math.random() * candidates.length)].name);
  };

  const openNumberPicker = async () => {
    hapticTabTap();
    const pool = await ensureUsers();
    setNpSliderMax(pool.length > 1 ? pool.length : 10);
    setNpOpen(true);
  };

  const loadMovieGroups = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchMovieGroups({ sort: "desc" })
      .then((data) => {
        setMovieGroups(data.groups);
        setCurrentRound(data.currentRound);
        setMaxRound(data.lastRound);
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

  useSwipeBack(closeMovieForm, addMovieEl);

  const openAddMovie = () => {
    hapticTabTap();
    setEditingMovie(undefined);
    setShowMovieForm(true);
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
    setIsDeleting(false);
  };

  const executeDelete = async () => {
    if (!movieToDelete) return;
    hapticTabTap();
    setIsDeleting(true);
    try {
      await deleteMovie(movieToDelete.id);
      setMovieToDelete(null);
      setDeleteError(null);
      setIsDeleting(false);
      loadMovieGroups();
    } catch (err) {
      setIsDeleting(false);
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

  const showTmdb = normalizedQuery.length >= 3;

  const totalMovies = movieGroups.reduce((sum, g) => sum + g.movies.length, 0);

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
            onClick={pickHost}
            disabled={hostPicker.spinning}
          >
            {hostPicker.spinning ? (
              <>
                <Loader size={20} className="mlp__card-icon tmdb-section__spinner" />
                <span className="mlp__card-label">{t('groupList.labelPickingHost')}</span>
              </>
            ) : (
              <>
                <Trophy size={20} className="mlp__card-icon" />
                <span className="mlp__card-value">{currentRound}</span>
                <span className="mlp__card-label">{t('groupList.labelRound')}</span>
              </>
            )}
          </button>
          <button
            type="button"
            className="mlp__card"
            onClick={openNumberPicker}
          >
            <Clapperboard size={20} className="mlp__card-icon" />
            <span className="mlp__card-value">{totalMovies}</span>
            <span className="mlp__card-label">{t('groupList.labelWatched')}</span>
          </button>
          <button type="button" className="mlp__card--action" onClick={openAddMovie}>
            <Plus size={26} className="mlp__card-icon" />
            <span className="mlp__card-label">{t('groupList.btnAddMovie')}</span>
          </button>
        </div>
      </div>

      <div className="mlp__search-bar">
        <div className="mlp__search">
          <Search size={18} className="mlp__search-icon" />
          <input
            type="search"
            inputMode="search"
            placeholder={t('groupList.placeholderSearch')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="mlp__search-clear" onClick={() => setSearchQuery("")} aria-label={t('groupList.placeholderSearch')}>
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      <div className="movie-list">
        {normalizedQuery && visibleGroups.length === 0 && !showTmdb && (
          <p className="movie-list__no-results">{t('groupList.noMatch')} "{searchQuery}"</p>
        )}
        {showTmdb && visibleGroups.length > 0 && (
          <div className="movie-group__header">
            <h3>{t('groupList.sectionInYourClub')}</h3>
          </div>
        )}
        {visibleGroups.map((group) => (
          <RoundSection
            key={group.groupId}
            movieGroup={group}
            expandedId={expandedId}
            openSwipeId={openSwipeId}
            isAdmin={isAdmin}
            onToggle={(id) => { setOpenSwipeId(null); setExpandedId(expandedId === id ? null : id); }}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onSwipeOpen={(id) => setOpenSwipeId(id)}
            onSwipeClose={(id) => setOpenSwipeId((cur) => cur === id ? null : cur)}
            onSwipeBegin={(id) => { if (openSwipeId !== null && openSwipeId !== id) setOpenSwipeId(null); }}
          />
        ))}
        {showTmdb && (
          <TmdbSearchSection query={searchQuery} />
        )}
      </div>

      {showMovieForm && (
        <div className="movie-list__add__movie" ref={setAddMovieEl}>
          <AddMoviePage
            key={editingMovie?.id ?? "new"}
            currentRound={currentRound}
            maxRound={maxRound}
            movie={editingMovie}
            onBack={closeMovieForm}
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

      {hostPicker.result && (
        <div className="confirm-dialog-overlay" onClick={hostPicker.clear}>
          <div className="confirm-dialog" style={{ position: "relative", overflow: "visible" }} onClick={(e) => e.stopPropagation()}>
            <FireworkSparks key={hostPicker.result} />
            <p>Next Host is <strong>{hostPicker.result}</strong></p>
            <div className="confirm-dialog__actions">
              <button type="button" onClick={hostPicker.clear}>OK</button>
            </div>
          </div>
        </div>
      )}

      {npOpen && (
        <NumberPickerDialog
          sliderMax={npSliderMax}
          onClose={() => setNpOpen(false)}
        />
      )}
    </div>
  );
};

export default GroupListPage;