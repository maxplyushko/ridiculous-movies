import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import "../personal.css";
import confetti from "canvas-confetti";
import type { PersonalMovie } from "../types/PersonalMovie.ts";
import type { TmdbMovie } from "@/types/TmdbMovie.ts";
import { PersonalSection } from "./PersonalSection.tsx";
import AddPersonalMoviePage from "./AddPersonalMoviePage.tsx";
import { ChartLine, Dices, Loader, Plus } from "lucide-react";
import { RatingModal } from "@/components/RatingModal.tsx";
import { MoviePage } from "@/components/MoviePage.tsx";
import { ActorPage } from "@/components/ActorPage.tsx";
import { ConfirmDialog } from "@/components/ConfirmDialog.tsx";
import { Dialog } from "@/components/Dialog.tsx";
import { FireworkSparks } from "@/components/FireworkSparks.tsx";
import { useSpinPicker } from "@/hooks/useSpinPicker.ts";
import { deletePersonalMovie, editPersonalMovie, fetchPersonalList } from "../api/personalList.ts";
import { ListSearchBar } from "@/components/ListSearchBar.tsx";
import { ListSearchPage } from "@/components/ListSearchPage.tsx";
import { MovieListSkeleton } from "@/components/MovieListSkeleton.tsx";
import { ErrorScreen } from "@/components/ErrorScreen.tsx";
import { hapticSpinReveal, hapticTabTap } from "@/utils/haptics.ts";
import { useSwipeBack } from "@/hooks/useSwipeBack.ts";
import { useDetailStack } from "@/hooks/useDetailStack.ts";
import { useCloseSwipeOnOutsideTap } from "@/hooks/useCloseSwipeOnOutsideTap.ts";
import { useRegisterSubPage } from "@/hooks/useSubPage.ts";
import { randomInt } from "@/utils/random.ts";
import { PAGE_EXIT_MS, Presence } from "@/components/Presence.tsx";

type DetailEntry =
  | { kind: "personal"; movieId: string }
  | { kind: "tmdb"; movie: TmdbMovie }
  | { kind: "actor"; personId: number };

const CELEBRATION_COLORS = ["#ffd60a", "#ff9f0a", "#30d158", "#3390ec", "#ff375f", "#bf5af2"];

function fireWatchedCelebration() {
  const defaults = { origin: { x: 0.5, y: 0.5 }, colors: CELEBRATION_COLORS, disableForReducedMotion: true };
  confetti({ ...defaults, particleCount: 25, spread: 360, startVelocity: 22, ticks: 60, scalar: 0.75, shapes: ["star" as const] });
  confetti({ ...defaults, particleCount: 15, spread: 360, startVelocity: 36, ticks: 50, scalar: 0.55 });
}

const PersonalListPage = ({ active, currentUserId, onShowStats, resetSignal }: Readonly<{ active: boolean; currentUserId: string; onShowStats: () => void; resetSignal?: number }>) => {
  const { t } = useTranslation();
  const [movies, setMovies] = useState<PersonalMovie[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingMovie, setEditingMovie] = useState<PersonalMovie | undefined>(undefined);
  const [movieToDelete, setMovieToDelete] = useState<PersonalMovie | null>(null);
  const [ratingMovie, setRatingMovie] = useState<PersonalMovie | null>(null);
  const [ratingOnly, setRatingOnly] = useState(false);
  const [celebratingId, setCelebratingId] = useState<string | null>(null);
  const [openSwipeId, setOpenSwipeId] = useState<string | null>(null);
  const detailStack = useDetailStack<DetailEntry>();

  useEffect(() => { detailStack.reset(); }, [resetSignal]); // eslint-disable-line react-hooks/exhaustive-deps
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formEl, setFormEl] = useState<HTMLDivElement | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchEl, setSearchEl] = useState<HTMLDivElement | null>(null);
  const toggleVersionRef = useRef<Map<string, number>>(new Map());
  const moviePicker = useSpinPicker<string>();

  useRegisterSubPage(showForm || showSearch);

  const closeSearch = useCallback(() => {
    setShowSearch(false);
    setSearchQuery("");
  }, []);
  useSwipeBack(closeSearch, searchEl);

  const loadMovies = useCallback((silent?: boolean) => {
    if (!silent) setLoading(true);
    setError(null);
    fetchPersonalList()
      .then(setMovies)
      .catch((err: Error) => { if (!silent) setError(err); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    queueMicrotask(loadMovies);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const wasActiveRef = useRef(active);
  useEffect(() => {
    if (active && !wasActiveRef.current) loadMovies(true);
    wasActiveRef.current = active;
  }, [active, loadMovies]);

  const closeForm = () => {
    setShowForm(false);
    loadMovies(true);
  };

  useSwipeBack(closeForm, formEl);

  const lastKnownMoviesRef = useRef<Map<string, PersonalMovie>>(new Map());
  useEffect(() => {
    movies.forEach((m) => lastKnownMoviesRef.current.set(m.id, m));
  }, [movies]);
  const resolvePersonalMovie = (movieId: string): PersonalMovie | null =>
    movies.find((m) => m.id === movieId) ?? lastKnownMoviesRef.current.get(movieId) ?? null;

  useCloseSwipeOnOutsideTap(openSwipeId, () => setOpenSwipeId(null));

  const handleEdit = (movie: PersonalMovie) => {
    setOpenSwipeId(null);
    setEditingMovie(movie);
    setShowForm(true);
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
      tagline: movie.tagline,
      rating: rating ?? movie.rating,
      watched: !movie.watched,
      tmdbId: movie.tmdbId,
      tmdbMediaType: movie.tmdbMediaType,
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

  const updateRating = async (movie: PersonalMovie, rating: number) => {
    try {
      const updated = await editPersonalMovie(movie.id, {
        title: movie.title,
        description: movie.description,
        tagline: movie.tagline,
        rating,
        watched: movie.watched,
        tmdbId: movie.tmdbId,
        tmdbMediaType: movie.tmdbMediaType,
      });
      setMovies((prev) => prev.map((m) => m.id === updated.id ? updated : m));
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

  const handleToggleWatched = (movie: PersonalMovie) => {
    if (movie.watched) {
      void applyToggle(movie);
    } else {
      setRatingOnly(false);
      setRatingMovie(movie);
    }
  };

  const normalizedQuery = searchQuery.toLowerCase().trim();
  const matchedMovies = normalizedQuery
    ? movies.filter((m) =>
        m.title.toLowerCase().includes(normalizedQuery) || m.description.toLowerCase().includes(normalizedQuery)
      )
    : [];
  const toWatch = movies.filter((m) => m.inList && !m.watched);
  const watched = movies.filter((m) => m.watched);

  const buildSectionProps = (onOpened?: (title: string) => void) => ({
    openSwipeId,
    celebratingId,
    onEdit: handleEdit,
    onDelete: (movie: PersonalMovie) => { setDeleteError(null); setMovieToDelete(movie); },
    onToggleWatched: handleToggleWatched,
    onOpen: (movie: PersonalMovie) => { if (openSwipeId !== null) { setOpenSwipeId(null); return; } onOpened?.(movie.title); detailStack.push({ kind: "personal", movieId: movie.id }); },
    onSwipeOpen: (id: string) => setOpenSwipeId(id),
    onSwipeClose: (id: string) => setOpenSwipeId((cur) => (cur === id ? null : cur)),
    onSwipeBegin: (id: string) => { if (openSwipeId !== null && openSwipeId !== id) setOpenSwipeId(null); },
  });

  const renderSections = (toWatchItems: PersonalMovie[], watchedItems: PersonalMovie[], onOpened?: (title: string) => void) => {
    const props = buildSectionProps(onOpened);
    return (
      <>
        <PersonalSection title={t('personalList.sectionToWatch')} movies={toWatchItems} {...props} />
        <PersonalSection title={t('personalList.sectionWatched')} movies={watchedItems} {...props} />
      </>
    );
  };

  if (isLoading) return <MovieListSkeleton />;
  if (error) {
    console.error(error);
    return <ErrorScreen error={error} />;
  }

  return (
    <div className="mlp">
      <div className="mlp__hero">
        <div className="mlp__cards">
          <button
            type="button"
            className="mlp__card"
            disabled={moviePicker.spinning || toWatch.length === 0}
            onClick={() => {
              if (toWatch.length === 0 || moviePicker.spinning) return;
              hapticTabTap();
              moviePicker.spin(() => toWatch[randomInt(toWatch.length)].title);
            }}
          >
            {moviePicker.spinning
              ? <Loader size={20} className="mlp__card-icon tmdb-section__spinner" />
              : <Dices size={20} className="mlp__card-icon" />}
          </button>
          <button
            type="button"
            className="mlp__card"
            onClick={() => { hapticTabTap(); onShowStats(); }}
          >
            <ChartLine size={20} className="mlp__card-icon" />
          </button>
          <button
            type="button"
            className="mlp__card mlp__card--accent"
            onClick={() => { hapticTabTap(); setEditingMovie(undefined); setShowForm(true); }}
          >
            <Plus size={20} className="mlp__card-icon" />
          </button>
        </div>
      </div>

      <ListSearchBar
        placeholder={t('personalList.placeholderSearch')}
        onOpen={() => { hapticTabTap(); setShowSearch(true); }}
      />

      <div className="movie-list">
        {renderSections(toWatch, watched)}
        {movies.length === 0 && (
          <p className="movie-list__no-results">{t('personalList.empty')}</p>
        )}
      </div>

      {showSearch && (
        <ListSearchPage
          placeholder={t('personalList.placeholderSearch')}
          query={searchQuery}
          onQueryChange={setSearchQuery}
          onBack={closeSearch}
          containerRef={setSearchEl}
          userId={currentUserId}
          scope="personal"
        >
          {(recordRecent) => (
            <>
              {renderSections(
                matchedMovies.filter((m) => m.inList && !m.watched),
                matchedMovies.filter((m) => m.watched),
                recordRecent
              )}
              {matchedMovies.length === 0 && (
                <p className="movie-list__no-results">{t('personalList.noMatch')} "{searchQuery}"</p>
              )}
            </>
          )}
        </ListSearchPage>
      )}

      <Presence show={movieToDelete !== null}>
        {movieToDelete && (
          <ConfirmDialog
            message={t('personalList.confirmDelete', { title: movieToDelete.title })}
            error={deleteError}
            isLoading={isDeleting}
            cancelLabel={t('personalList.btnCancel')}
            confirmLabel={t('personalList.btnDelete')}
            onCancel={cancelDelete}
            onConfirm={executeDelete}
          />
        )}
      </Presence>

      <Presence show={moviePicker.result !== null}>
        {moviePicker.result && (
          <Dialog className="confirm-dialog confirm-dialog--fireworks" onClose={moviePicker.clear}>
            <FireworkSparks key={moviePicker.result} />
            <p className="confirm-dialog__subtitle">{t('personalList.randomTitle')}</p>
            <p><strong>{moviePicker.result}</strong></p>
            <div className="confirm-dialog__actions">
              <button type="button" onClick={moviePicker.clear}>{t('personalList.btnOk')}</button>
            </div>
          </Dialog>
        )}
      </Presence>

      <Presence show={ratingMovie !== null}>
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
              if (!ratingOnly && !movie.watched) {
                void applyToggle(movie);
                celebrate(movie.id);
              }
            }}
            onSave={async (rating) => {
              const movie = ratingMovie;
              setRatingMovie(null);
              if (ratingOnly || movie.watched) {
                await updateRating(movie, rating);
              } else {
                void applyToggle(movie, rating);
                celebrate(movie.id);
              }
            }}
          />
        )}
      </Presence>

      {detailStack.stack.map((entry, i) => {
        const isTop = i === detailStack.stack.length - 1;
        const ref = isTop ? detailStack.setTopEl : undefined;
        if (entry.kind === "actor") {
          return (
            <div className="movie-list__add__movie" key={`actor-${entry.personId}`} ref={ref}>
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
            <div className="movie-list__add__movie" key={`tmdb-${entry.movie.id}`} ref={ref}>
              <MoviePage
                source={{ kind: "tmdb", movie: entry.movie }}
                onBack={detailStack.pop}
                onPersonalStateChange={() => loadMovies(true)}
                onOpenActor={(personId) => detailStack.push({ kind: "actor", personId })}
              />
            </div>
          );
        }
        const movie = resolvePersonalMovie(entry.movieId);
        if (!movie) return null;
        return (
          <div className="movie-list__add__movie" key={`personal-${entry.movieId}`} ref={ref}>
            <MoviePage
              source={{ kind: "personal", movie }}
              onBack={detailStack.pop}
              onEdit={() => handleEdit(movie)}
              onPersonalStateChange={() => loadMovies(true)}
              onOpenActor={(personId) => detailStack.push({ kind: "actor", personId })}
            />
          </div>
        );
      })}

      <Presence show={showForm} exitMs={PAGE_EXIT_MS}>
        {showForm && (
          <div className="movie-list__add__movie" ref={setFormEl}>
            <AddPersonalMoviePage
              key={editingMovie?.id ?? "new"}
              movie={editingMovie}
              onBack={closeForm}
            />
          </div>
        )}
      </Presence>
    </div>
  );
};

export default PersonalListPage;
