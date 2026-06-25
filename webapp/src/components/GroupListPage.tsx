import { useCallback, useEffect, useRef, useState } from "react";
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

const SPIN_TICK_MS = 65;
const SPIN_TICK_COUNT = 20;

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
  return (
    <div className="movie-group">
      <div className="movie-group__header">
        <div className="movie-group__header__round">
          <h3>Round {movieGroup.groupId}</h3>
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

const GroupListPage = ({ isAdmin }: { isAdmin: boolean }) => {
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
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [watchedBurst, setWatchedBurst] = useState<number | null>(null);
  const [addMovieEl, setAddMovieEl] = useState<HTMLDivElement | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [hostPickerSpinning, setHostPickerSpinning] = useState(false);
  const [pickedHost, setPickedHost] = useState<string | null>(null);
  const spinIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => {
    if (spinIntervalRef.current) clearInterval(spinIntervalRef.current);
  }, []);

  useEffect(() => {
    if (!pickedHost) return;
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
  }, [pickedHost]);

  const fireBurst = (set: (v: number | null) => void) => {
    hapticTabTap();
    const id = Date.now();
    set(id);
    setTimeout(() => set(null), 800);
  };

  const pickHost = async () => {
    if (hostPickerSpinning) return;
    hapticTabTap();

    let pool = users;
    if (pool.length === 0) {
      try {
        pool = await fetchUsers();
        setUsers(pool);
      } catch { return; }
    }
    if (pool.length === 0) return;

    const currentGroup = movieGroups.find((g) => g.groupId === currentRound);
    const hostedIds = new Set(currentGroup?.movies.map((m) => m.owner.id) ?? []);
    const remaining = pool.filter((u) => !hostedIds.has(u.id));
    const candidates = remaining.length > 0 ? remaining : pool;

    const final = candidates[Math.floor(Math.random() * candidates.length)];

    hapticSpinStart();
    setHostPickerSpinning(true);

    let ticks = 0;
    spinIntervalRef.current = setInterval(() => {
      ticks++;
      hapticSpinTick();
      if (ticks >= SPIN_TICK_COUNT) {
        clearInterval(spinIntervalRef.current!);
        spinIntervalRef.current = null;
        stopHaptics();
        setHostPickerSpinning(false);
        setPickedHost(final.name);
        hapticSpinReveal();
      }
    }, SPIN_TICK_MS);
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
    <div className="mlp">
      <div className="mlp__hero">
        <div className="mlp__cards">
          <button
            type="button"
            className="mlp__card"
            onClick={pickHost}
            disabled={hostPickerSpinning}
          >
            {hostPickerSpinning ? (
              <>
                <Loader size={20} className="mlp__card-icon tmdb-section__spinner" />
                <span className="mlp__card-label">Picking host…</span>
              </>
            ) : (
              <>
                <Trophy size={20} className="mlp__card-icon" />
                <span className="mlp__card-value">{currentRound}</span>
                <span className="mlp__card-label">Round</span>
              </>
            )}
          </button>
          <button
            type="button"
            className="mlp__card"
            onClick={() => fireBurst(setWatchedBurst)}
          >
            {watchedBurst !== null && <FireworkSparks key={watchedBurst} />}
            <Clapperboard size={20} className="mlp__card-icon" />
            <span className="mlp__card-value">{totalMovies}</span>
            <span className="mlp__card-label">Watched</span>
          </button>
          <button type="button" className="mlp__card mlp__card--action" onClick={openAddMovie}>
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

      <div className="movie-list" onClick={() => { if (openSwipeId !== null) setOpenSwipeId(null); }}>
        {normalizedQuery && visibleGroups.length === 0 && !showTmdb && (
          <p className="movie-list__no-results">No movies match "{searchQuery}"</p>
        )}
        {showTmdb && visibleGroups.length > 0 && (
          <div className="movie-group__header">
            <h3>In your club</h3>
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
      {pickedHost && (
        <div className="confirm-dialog-overlay">
          <div className="confirm-dialog" style={{ position: "relative", overflow: "visible" }}>
            <FireworkSparks key={pickedHost} />
            <p>Next Host is <strong>{pickedHost}</strong></p>
            <div className="confirm-dialog__actions">
              <button type="button" onClick={() => setPickedHost(null)}>OK</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupListPage;
