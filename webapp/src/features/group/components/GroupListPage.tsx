import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import "../group.css";
import type { MovieGroup } from "../types/MovieGroup.ts";
import type { Movie } from "../types/Movie.ts";
import type { User } from "@/types/User.ts";
import type { TmdbMovie } from "@/types/TmdbMovie.ts";
import { RoundSection } from "./RoundSection.tsx";
import { RandomizerDialog } from "./RandomizerDialog.tsx";
import AddMoviePage from "./AddMoviePage.tsx";
import { deleteMovie, fetchMovieGroups, rateMovie } from "../api/movies.ts";
import { fetchUsers } from "../api/users.ts";
import { ListSearchBar } from "@/components/ListSearchBar.tsx";
import { MovieListSkeleton } from "@/components/MovieListSkeleton.tsx";
import { ErrorScreen } from "@/components/ErrorScreen.tsx";
import { ConfirmDialog } from "@/components/ConfirmDialog.tsx";
import { RatingModal } from "@/components/RatingModal.tsx";
import { MoviePage } from "@/components/MoviePage.tsx";
import { ActorPage } from "@/components/ActorPage.tsx";
import { ChartLine, Dices, Plus } from "lucide-react";
import { hapticTabTap } from "@/utils/haptics.ts";
import { useSwipeBack } from "@/hooks/useSwipeBack.ts";
import { useDetailStack } from "@/hooks/useDetailStack.ts";
import { useCloseSwipeOnOutsideTap } from "@/hooks/useCloseSwipeOnOutsideTap.ts";
import { useRegisterSubPage } from "@/hooks/useSubPage.ts";
import { PAGE_EXIT_MS, Presence } from "@/components/Presence.tsx";

type DetailEntry =
  | { kind: "group"; movieId: string }
  | { kind: "tmdb"; movie: TmdbMovie }
  | { kind: "actor"; personId: number };

const GroupListPage = ({ isAdmin, currentUserId, onShowStats, resetSignal }: { isAdmin: boolean; currentUserId: string; onShowStats: () => void; resetSignal?: number }) => {
  const { t } = useTranslation();
  const [movieGroups, setMovieGroups] = useState<MovieGroup[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentRound, setCurrentRound] = useState(0);
  const [maxRound, setMaxRound] = useState(0);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const detailStack = useDetailStack<DetailEntry>();

  useEffect(() => { detailStack.reset(); }, [resetSignal]); // eslint-disable-line react-hooks/exhaustive-deps
  const [showMovieForm, setShowMovieForm] = useState(false);
  const [editingMovie, setEditingMovie] = useState<Movie | undefined>(undefined);
  const [movieToDelete, setMovieToDelete] = useState<Movie | null>(null);
  const [ratingMovie, setRatingMovie] = useState<Movie | null>(null);
  const [openSwipeId, setOpenSwipeId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [addMovieEl, setAddMovieEl] = useState<HTMLDivElement | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [npOpen, setNpOpen] = useState(false);
  const [npSliderMax, setNpSliderMax] = useState(10);
  const [npUsers, setNpUsers] = useState<User[]>([]);

  useCloseSwipeOnOutsideTap(openSwipeId, () => setOpenSwipeId(null));
  useRegisterSubPage(showMovieForm);

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

  const openRandomizer = async () => {
    hapticTabTap();
    const pool = await ensureUsers();
    setNpUsers(pool);
    setNpSliderMax(pool.length > 1 ? pool.length : 10);
    setNpOpen(true);
  };

  const loadMovieGroups = useCallback((silent?: boolean) => {
    if (!silent) setLoading(true);
    setError(null);
    fetchMovieGroups({ sort: "desc" })
      .then((data) => {
        setMovieGroups(data.groups);
        setCurrentRound(data.currentRound);
        setMaxRound(data.lastRound);
      })
      .catch((err: Error) => setError(err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    queueMicrotask(loadMovieGroups);
    queueMicrotask(ensureUsers);
  }, [loadMovieGroups]); // eslint-disable-line react-hooks/exhaustive-deps

  const closeMovieForm = () => {
    setShowMovieForm(false);
    loadMovieGroups(true);
  };

  useSwipeBack(closeMovieForm, addMovieEl);

  const handleEdit = (movie: Movie) => {
    setOpenSwipeId(null);
    setEditingMovie(movie);
    setShowMovieForm(true);
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

  if (isLoading) return <MovieListSkeleton />;
  if (error) {
    console.error(error);
    return <ErrorScreen error={error} />;
  }

  const normalizedQuery = searchQuery.toLowerCase().trim();
  const visibleGroups = normalizedQuery
    ? movieGroups
        .map((g) => ({
          ...g,
          movies: g.movies.filter((m) =>
            m.title.toLowerCase().includes(normalizedQuery) || m.description.toLowerCase().includes(normalizedQuery)
          ),
        }))
        .filter((g) => g.movies.length > 0)
    : movieGroups;

  return (
    <div className="mlp" onClick={() => { if (openSwipeId !== null) setOpenSwipeId(null); }}>
      <div className="mlp__hero">
        <div className="mlp__cards">
          <button type="button" className="mlp__card" onClick={openRandomizer} aria-label={t('groupList.labelRandom')}>
            <Dices size={20} className="mlp__card-icon" />
          </button>
          <button type="button" className="mlp__card" onClick={() => { hapticTabTap(); onShowStats(); }} aria-label={t('groupList.labelStatistics')}>
            <ChartLine size={20} className="mlp__card-icon" />
          </button>
          <button type="button" className="mlp__card mlp__card--accent" onClick={() => { hapticTabTap(); setEditingMovie(undefined); setShowMovieForm(true); }} aria-label={t('groupList.btnAddMovie')}>
            <Plus size={20} className="mlp__card-icon" />
          </button>
        </div>
      </div>

      <ListSearchBar value={searchQuery} onChange={setSearchQuery} placeholder={t('groupList.placeholderSearch')} />

      <div className="movie-list">
        {normalizedQuery && visibleGroups.length === 0 && (
          <p className="movie-list__no-results">{t('groupList.noMatch')} "{searchQuery}"</p>
        )}
        {visibleGroups.map((group) => (
          <RoundSection
            key={group.groupId}
            movieGroup={group}
            openSwipeId={openSwipeId}
            isAdmin={isAdmin}
            onOpen={(movie) => { if (openSwipeId !== null) { setOpenSwipeId(null); return; } detailStack.push({ kind: "group", movieId: movie.id }); }}
            onEdit={handleEdit}
            onDelete={(movie) => { setDeleteError(null); setMovieToDelete(movie); }}
            onSwipeOpen={(id) => setOpenSwipeId(id)}
            onSwipeClose={(id) => setOpenSwipeId((cur) => cur === id ? null : cur)}
            onSwipeBegin={(id) => { if (openSwipeId !== null && openSwipeId !== id) setOpenSwipeId(null); }}
          />
        ))}
      </div>

      {detailStack.stack.map((entry, i) => {
        const isTop = i === detailStack.stack.length - 1;
        const ref = isTop ? detailStack.setTopEl : undefined;
        if (entry.kind === "actor") {
          return (
            <div className="movie-list__add__movie" key={i} ref={ref}>
              <ActorPage
                personId={entry.personId}
                onBack={detailStack.pop}
                onOpenMovie={(m) => detailStack.push({ kind: "tmdb", movie: m })}
              />
            </div>
          );
        }
        if (entry.kind === "tmdb") {
          return (
            <div className="movie-list__add__movie" key={i} ref={ref}>
              <MoviePage
                source={{ kind: "tmdb", movie: entry.movie }}
                onBack={detailStack.pop}
                onOpenActor={(personId) => detailStack.push({ kind: "actor", personId })}
              />
            </div>
          );
        }
        const movie = movieGroups.flatMap((g) => g.movies).find((m) => m.id === entry.movieId);
        if (!movie) return null;
        return (
          <div className="movie-list__add__movie" key={i} ref={ref}>
            <MoviePage
              source={{ kind: "group", movie }}
              currentUserId={currentUserId}
              onBack={detailStack.pop}
              onRate={() => setRatingMovie(movie)}
              onEdit={() => handleEdit(movie)}
              onOpenActor={(personId) => detailStack.push({ kind: "actor", personId })}
            />
          </div>
        );
      })}

      <Presence show={showMovieForm} exitMs={PAGE_EXIT_MS}>
        {showMovieForm && (
          <div className="movie-list__add__movie" ref={setAddMovieEl}>
            <AddMoviePage
              key={editingMovie?.id ?? "new"}
              currentRound={currentRound}
              maxRound={maxRound}
              currentUserId={currentUserId}
              movie={editingMovie}
              users={users}
              onBack={closeMovieForm}
            />
          </div>
        )}
      </Presence>

      <Presence show={movieToDelete !== null}>
        {movieToDelete && (
          <ConfirmDialog
            message={t('groupList.confirmDelete', { title: movieToDelete.title })}
            error={deleteError}
            isLoading={isDeleting}
            cancelLabel={t('groupList.btnCancel')}
            confirmLabel={t('groupList.btnDelete')}
            onCancel={cancelDelete}
            onConfirm={executeDelete}
          />
        )}
      </Presence>

      <Presence show={ratingMovie !== null}>
        {ratingMovie && (
          <RatingModal
            title={ratingMovie.title}
            cancelLabel={t('groupList.btnCancel')}
            saveLabel={t('personalList.btnSave')}
            onCancel={() => setRatingMovie(null)}
            onSave={async (score) => {
              await rateMovie(ratingMovie.id, score);
              setRatingMovie(null);
              loadMovieGroups(true);
            }}
          />
        )}
      </Presence>

      <Presence show={npOpen}>
        {npOpen && (
          <RandomizerDialog
            sliderMax={npSliderMax}
            users={npUsers}
            movieGroups={movieGroups}
            currentRound={currentRound}
            onClose={() => setNpOpen(false)}
          />
        )}
      </Presence>
    </div>
  );
};

export default GroupListPage;
