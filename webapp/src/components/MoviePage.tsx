import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Bookmark, Calendar, ChevronDown, ChevronUp, Clapperboard, Clock, Eye, Globe, Info, Loader, Pencil, Star, Tv, User, Users, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import type { Movie } from "@/features/group/types/Movie";
import type { PersonalMovie } from "@/features/personal/types/PersonalMovie";
import type { TmdbCastMember, TmdbMovie, TmdbMovieDetails } from "@/types/TmdbMovie";
import { useTmdbMovieDetails } from "@/hooks/useTmdbMovieDetails.ts";
import { fetchGroupMembersWhoAdded } from "@/features/personal/api/personalList.ts";
import { fetchGroupMovieMatch } from "@/features/group/api/movies.ts";
import { usePersonalStateSync } from "@/hooks/usePersonalStateSync.ts";
import { PageBackButton } from "@/components/PageBackButton.tsx";
import { GuestLimitModal } from "@/components/GuestLimitModal.tsx";
import { RatingModal } from "@/components/RatingModal.tsx";
import { Presence } from "@/components/Presence.tsx";
import { Dialog } from "@/components/Dialog.tsx";
import { hapticTabTap } from "@/utils/haptics.ts";
import noPosterFallback from "@/assets/no-poster.png";

export type MoviePageSource =
  | { kind: "group"; movie: Movie }
  | { kind: "personal"; movie: PersonalMovie }
  | { kind: "tmdb"; movie: TmdbMovie };

type MoviePageProps = {
  source: MoviePageSource;
  currentUserId?: string;
  onBack: () => void;
  onRate?: () => void | Promise<unknown>;
  onEdit?: () => void;
  onPersonalStateChange?: () => void;
  onOpenActor?: (personId: number) => void;
};

const POSTER_MAX_RETRIES = 2;
const POSTER_TIMEOUT_MS = 15000;

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function MoviePagePoster({
  title,
  onBack,
  onEdit,
  displayPosterUrl,
  posterReady,
  onPosterError,
  onOpenFullscreen,
}: Readonly<{
  title: string;
  onBack: () => void;
  onEdit?: () => void;
  displayPosterUrl: string | null;
  posterReady: boolean;
  onPosterError: () => void;
  onOpenFullscreen: () => void;
}>) {
  const { t } = useTranslation();
  return (
    <div className="movie-page__poster-wrap">
      <PageBackButton onBack={onBack} />
      {onEdit && (
        <button
          type="button"
          className="movie-page__edit-btn"
          aria-label={t('moviePage.actionEdit')}
          onClick={() => { hapticTabTap(); onEdit(); }}
        >
          <Pencil size={20} />
        </button>
      )}
      <div className="movie-page__poster-backdrop" style={displayPosterUrl ? { backgroundImage: `url(${displayPosterUrl})` } : undefined} />
      <button
        type="button"
        className={`movie-page__poster${posterReady ? " movie-page__poster--tappable" : ""}`}
        disabled={!posterReady}
        aria-label={title}
        onClick={() => { hapticTabTap(); onOpenFullscreen(); }}
      >
        {!posterReady && <div className="movie-page__poster-skeleton sk-card" />}
        {displayPosterUrl && (
          <img
            src={displayPosterUrl}
            alt={title}
            decoding="async"
            className={posterReady ? "movie-page__poster-img--loaded" : ""}
            onError={onPosterError}
          />
        )}
      </button>
    </div>
  );
}

function MoviePageSubhead({
  detailsLoading,
  genres,
  mediaType,
  numberOfSeasons,
  durationMinutes,
  releaseYear,
  tmdbScore,
  t,
}: Readonly<{
  detailsLoading: boolean;
  genres: string[];
  mediaType: string;
  numberOfSeasons: number | null;
  durationMinutes: number | null;
  releaseYear: number | string | null | undefined;
  tmdbScore: number | null | undefined;
  t: TFunction;
}>) {
  if (detailsLoading) {
    return (
      <div className="movie-page__meta-skeleton">
        <div className="sk-line movie-page__sk-genres" />
        <div className="movie-page__meta">
          <div className="sk-line movie-page__sk-chip" />
          <div className="sk-line movie-page__sk-chip" />
          <div className="sk-line movie-page__sk-chip" />
        </div>
      </div>
    );
  }
  return (
    <>
      {genres.length > 0 && <p className="movie-page__genres">{genres.join(" · ")}</p>}
      <div className="movie-page__meta">
        <span>
          {mediaType === "tv" ? <Tv size={14} /> : <Clapperboard size={14} />}
          {mediaType === "tv" ? t('moviePage.tvShow') : t('moviePage.movie')}
        </span>
        {mediaType === "tv" && numberOfSeasons != null && (
          <span>{t('moviePage.seasons', { count: numberOfSeasons })}</span>
        )}
        {durationMinutes != null && (
          <span>
            <Clock size={14} />
            {mediaType === "tv" ? t('moviePage.episodeDuration', { count: durationMinutes }) : formatDuration(durationMinutes)}
          </span>
        )}
        {releaseYear && <span><Calendar size={14} />{releaseYear}</span>}
        {!!tmdbScore && <span><Globe size={14} />{tmdbScore.toFixed(1)}</span>}
      </div>
    </>
  );
}

function MoviePageActions({
  canRate,
  ownRating,
  onRateTap,
  hasGroupRatings,
  groupRating,
  groupExpanded,
  onToggleGroupExpanded,
  statusLoading,
  inList,
  watched,
  onToggleInList,
  onToggleWatched,
  t,
}: Readonly<{
  canRate: boolean;
  ownRating: number | null;
  onRateTap: () => void;
  hasGroupRatings: boolean;
  groupRating: number | null;
  groupExpanded: boolean;
  onToggleGroupExpanded: () => void;
  statusLoading: boolean;
  inList: boolean;
  watched: boolean;
  onToggleInList: () => void;
  onToggleWatched: () => void;
  t: TFunction;
}>) {
  return (
    <div className="movie-page__actions">
      {canRate && (
        <button
          type="button"
          className={`movie-page__action${ownRating != null ? " movie-page__action--rated" : ""}`}
          onClick={onRateTap}
        >
          <Star size={26} fill={ownRating != null ? "currentColor" : "none"} />
          <span className="movie-page__action-label">
            {ownRating != null ? ownRating.toFixed(1) : t('moviePage.actionRate')}
          </span>
        </button>
      )}
      {hasGroupRatings && groupRating != null && (
        <button
          type="button"
          className={`movie-page__action movie-page__action--groupbadge${groupExpanded ? " movie-page__action--group-open" : ""}`}
          onClick={onToggleGroupExpanded}
        >
          <Users size={26} />
          <span className="movie-page__action-label">{groupRating.toFixed(1)}</span>
        </button>
      )}
      {statusLoading ? (
        <>
          <div className="movie-page__action movie-page__action-skeleton">
            <Loader size={26} className="movie-page__action-spinner" />
            <div className="sk-line movie-page__sk-action-label" />
          </div>
          <div className="movie-page__action movie-page__action-skeleton">
            <Loader size={26} className="movie-page__action-spinner" />
            <div className="sk-line movie-page__sk-action-label" />
          </div>
        </>
      ) : (
        <>
          <button
            type="button"
            className={`movie-page__action${inList ? " movie-page__action--listed" : ""}`}
            aria-label={inList ? t('moviePage.actionInList') : t('moviePage.actionToWatch')}
            onClick={onToggleInList}
          >
            <Bookmark size={26} fill={inList ? "currentColor" : "none"} />
            <span className="movie-page__action-label">{inList ? t('moviePage.actionInList') : t('moviePage.actionToWatch')}</span>
          </button>
          <button
            type="button"
            className={`movie-page__action${watched ? " movie-page__action--watched" : ""}`}
            aria-label={watched ? t('moviePage.actionWatched') : t('moviePage.actionNotWatched')}
            onClick={onToggleWatched}
          >
            <Eye size={26} />
            <span className="movie-page__action-label">{watched ? t('moviePage.actionWatched') : t('moviePage.actionNotWatched')}</span>
          </button>
        </>
      )}
    </div>
  );
}

function MoviePageRatingsReveal({
  groupRatings,
  groupExpanded,
}: Readonly<{ groupRatings: Movie["ratings"]; groupExpanded: boolean }>) {
  return (
    <div className={`movie-page__ratings-reveal${groupExpanded ? " movie-page__ratings-reveal--open" : ""}`}>
      <div className="movie-item-details__ratings">
        {[...groupRatings]
          .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
          .map((r) => (
            <span
              key={r.id}
              className={`movie-item-details__rating-item${r.isHostRating ? " movie-item-details__rating-item--host" : ""}`}
            >
              <User size={16} /> {r.user.name}: {r.score.toFixed(1)}
            </span>
          ))}
      </div>
    </div>
  );
}

function MoviePageDescription({
  description,
  descRef,
  descExpanded,
  descClamped,
  onToggle,
  t,
}: Readonly<{
  description: string;
  descRef: React.RefObject<HTMLParagraphElement | null>;
  descExpanded: boolean;
  descClamped: boolean;
  onToggle: () => void;
  t: TFunction;
}>) {
  return (
    <div className="movie-page__description-block">
      <p className="movie-page__section-title">{t('moviePage.overview')}</p>
      <p
        ref={descRef}
        className={`movie-page__description${!descExpanded ? " movie-page__description--clamped" : ""}`}
      >
        {description}
      </p>
      {descClamped && (
        <button
          type="button"
          className="movie-page__description-toggle"
          aria-label={descExpanded ? t('moviePage.collapse') : t('moviePage.expand')}
          onClick={onToggle}
        >
          {descExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      )}
    </div>
  );
}

function CastItem({
  member,
  photoKey,
  photoLoaded,
  onPhotoSettled,
  onOpenActor,
}: Readonly<{
  member: TmdbCastMember;
  photoKey: string;
  photoLoaded: boolean;
  onPhotoSettled: (photoKey: string) => void;
  onOpenActor?: (personId: number) => void;
}>) {
  const content = (
    <>
      <div className="movie-page__cast-photo">
        {member.profileUrl
          ? (
            <>
              {!photoLoaded && <Loader size={18} className="movie-page__cast-photo-spinner" />}
              <img
                src={member.profileUrl}
                alt={member.name}
                loading="lazy"
                decoding="async"
                className={photoLoaded ? "" : "movie-page__cast-photo-img--hidden"}
                onLoad={() => onPhotoSettled(photoKey)}
                onError={() => onPhotoSettled(photoKey)}
              />
            </>
          )
          : <User size={24} />}
      </div>
      <span className="movie-page__cast-name">{member.name}</span>
      {member.character && <span className="movie-page__cast-character">{member.character}</span>}
    </>
  );
  if (!onOpenActor) {
    return <div className="movie-page__cast-item">{content}</div>;
  }
  return (
    <button type="button" className="movie-page__cast-item" onClick={() => { hapticTabTap(); onOpenActor(member.id); }}>
      {content}
    </button>
  );
}

function MoviePageCrew({
  detailsLoading,
  mediaType,
  director,
  cast,
  loadedCastPhotos,
  onPhotoSettled,
  onOpenActor,
  t,
}: Readonly<{
  detailsLoading: boolean;
  mediaType: string;
  director: string | null;
  cast: TmdbCastMember[];
  loadedCastPhotos: Record<string, boolean>;
  onPhotoSettled: (photoKey: string) => void;
  onOpenActor?: (personId: number) => void;
  t: TFunction;
}>) {
  if (detailsLoading) {
    return (
      <div className="movie-page__crew">
        <div className="movie-page__director-row">
          <div className="sk-line movie-page__sk-director" />
        </div>
        <div className="movie-page__cast-list">
          {Array.from({ length: 5 }).map((_, i) => (
            <div className="movie-page__cast-item" key={i}>
              <div className="sk-line movie-page__sk-cast-photo" />
              <div className="sk-line movie-page__sk-cast-name" />
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (!director && cast.length === 0) return null;
  return (
    <div className="movie-page__crew">
      {director && (
        <div className="movie-page__director-row">
          <p className="movie-page__section-title">
            {t(mediaType === "tv" ? 'moviePage.creator' : 'moviePage.director')}
          </p>
          <p className="movie-page__crew-director">{director}</p>
        </div>
      )}
      {cast.length > 0 && (
        <div>
          <p className="movie-page__section-title">{t('moviePage.cast')}</p>
          <div className="movie-page__cast-list">
            {cast.map((c, i) => {
              const photoKey = `${c.name}-${i}`;
              return (
                <CastItem
                  key={photoKey}
                  member={c}
                  photoKey={photoKey}
                  photoLoaded={!!loadedCastPhotos[photoKey]}
                  onPhotoSettled={onPhotoSettled}
                  onOpenActor={onOpenActor}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function usePosterLoad(posterUrl: string | null, source: MoviePageSource, detailsLoading: boolean) {
  const [posterLoaded, setPosterLoaded] = useState(false);
  const [posterErrored, setPosterErrored] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPosterLoaded(false);
    setPosterErrored(false);

    if (!posterUrl) return;

    let cancelled = false;
    let attempt = 0;
    const img = new Image();

    const timer = setTimeout(() => { if (!cancelled) setPosterErrored(true); }, POSTER_TIMEOUT_MS);

    const succeed = () => { if (!cancelled) { setPosterLoaded(true); clearTimeout(timer); } };
    const fail = () => {
      if (cancelled) return;
      if (attempt < POSTER_MAX_RETRIES) {
        attempt += 1;
        img.src = posterUrl;
      } else {
        setPosterErrored(true);
      }
    };

    img.onload = succeed;
    img.onerror = fail;
    img.src = posterUrl;
    if (img.complete && img.naturalWidth > 0) succeed();

    return () => {
      cancelled = true;
      img.onload = null;
      img.onerror = null;
      clearTimeout(timer);
    };
  }, [posterUrl]);

  const posterKnown = source.kind === "tmdb" || !detailsLoading;
  const showFallbackPoster = posterKnown && (!posterUrl || posterErrored);
  const displayPosterUrl = showFallbackPoster ? noPosterFallback : posterUrl;
  const posterReady = showFallbackPoster || posterLoaded;

  return { displayPosterUrl, posterReady, setPosterErrored };
}

function deriveMovieFields(source: MoviePageSource, details: TmdbMovieDetails | null | undefined) {
  const tmdbId = source.kind === "tmdb" ? source.movie.id : source.movie.tmdbId;
  const mediaType = source.kind === "tmdb"
    ? source.movie.mediaType
    : (source.movie.tmdbMediaType ?? "movie");
  const title = source.movie.title;
  const description = source.kind === "tmdb" ? source.movie.overview : source.movie.description;
  const posterUrl = source.kind === "tmdb" ? source.movie.posterUrl : (details?.posterUrl ?? null);
  const tmdbScore = source.kind === "tmdb" ? source.movie.tmdbScore : details?.tmdbScore;
  const releaseYear = source.kind === "tmdb" ? source.movie.releaseYear : details?.releaseYear;
  const customTagline = source.kind !== "tmdb" ? source.movie.tagline : null;
  const tagline = customTagline || details?.tagline || null;

  return { tmdbId, mediaType, title, description, posterUrl, tmdbScore, releaseYear, customTagline, tagline };
}

export function MoviePage({ source, currentUserId, onBack, onRate, onEdit, onPersonalStateChange, onOpenActor }: Readonly<MoviePageProps>) {
  const { t } = useTranslation();
  const tmdbId = source.kind === "tmdb" ? source.movie.id : source.movie.tmdbId;
  const mediaType = source.kind === "tmdb"
    ? source.movie.mediaType
    : (source.movie.tmdbMediaType ?? "movie");
  const { details, loading: detailsLoading } = useTmdbMovieDetails(tmdbId, mediaType);
  const { title, description, posterUrl, tmdbScore: resolvedTmdbScore, releaseYear: resolvedReleaseYear, customTagline, tagline: resolvedTagline } =
    deriveMovieFields(source, details);
  const descRef = useRef<HTMLParagraphElement | null>(null);
  const [descExpanded, setDescExpanded] = useState(false);
  const [descClamped, setDescClamped] = useState(false);
  const [loadedCastPhotos, setLoadedCastPhotos] = useState<Record<string, boolean>>({});

  const numberOfSeasons = details?.numberOfSeasons ?? null;
  const durationMinutes = details?.durationMinutes ?? null;
  const genres = details?.genres ?? [];
  const director = details?.director ?? null;
  const cast = details?.cast ?? [];
  const [addedByMembers, setAddedByMembers] = useState<string[]>([]);
  const [groupMatch, setGroupMatch] = useState<Movie | null>(null);
  const [groupExpanded, setGroupExpanded] = useState(false);
  const [showGuestLimit, setShowGuestLimit] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [posterFullscreen, setPosterFullscreen] = useState(false);
  const closePoster = useCallback(() => setPosterFullscreen(false), []);
  const { selfStatus, statusLoading, setInList, setWatched, setRating } = usePersonalStateSync({
    tmdbId,
    title,
    description,
    tagline: resolvedTagline,
    tmdbMediaType: mediaType,
    onChange: onPersonalStateChange,
    onError: (message) => { if (message === "GUEST_LIMIT_REACHED") setShowGuestLimit(true); },
  });

  useEffect(() => {
    if (tmdbId == null && !title) return;
    let cancelled = false;
    fetchGroupMembersWhoAdded(tmdbId, title)
      .then((names) => { if (!cancelled) setAddedByMembers(names); })
      .catch(() => { if (!cancelled) setAddedByMembers([]); });
    return () => { cancelled = true; };
  }, [tmdbId, title]);

  useEffect(() => {
    if (source.kind === "group") return;
    if (tmdbId == null && !title) return;
    let cancelled = false;
    fetchGroupMovieMatch(tmdbId, title)
      .then((match) => { if (!cancelled) setGroupMatch(match); })
      .catch(() => { if (!cancelled) setGroupMatch(null); });
    return () => { cancelled = true; };
  }, [source.kind, tmdbId, title]);

  const inList = selfStatus?.inList ?? false;
  const watched = selfStatus?.watched ?? false;
  const ownRating = source.kind === "group"
    ? (source.movie.ratings.find((r) => r.user.id === currentUserId)?.score ?? null)
    : (selfStatus?.rating ?? null);
  const groupRating = source.kind === "group" ? source.movie.averageRating : (groupMatch?.averageRating ?? null);
  const groupRatings = source.kind === "group" ? source.movie.ratings : (groupMatch?.ratings ?? []);
  const hasGroupRatings = groupRatings.length > 0;

  const canRate = source.kind === "group" ? !!onRate : true;
  const handleRateTap = () => {
    hapticTabTap();
    if (source.kind === "group") {
      onRate?.();
    } else {
      setShowRatingModal(true);
    }
  };

  const toggleInList = () => {
    hapticTabTap();
    setInList(!inList);
  };

  const toggleWatched = () => {
    hapticTabTap();
    setWatched(!watched);
  };

  const { displayPosterUrl, posterReady, setPosterErrored } = usePosterLoad(posterUrl, source, detailsLoading);

  useLayoutEffect(() => {
    const el = descRef.current;
    if (!el) return;
    setDescClamped(el.scrollHeight > el.clientHeight + 1);
  }, [description]);

  const handlePhotoSettled = (photoKey: string) => setLoadedCastPhotos((prev) => ({ ...prev, [photoKey]: true }));

  return (
    <div className="movie-page">
      <MoviePagePoster
        title={title}
        onBack={onBack}
        onEdit={onEdit}
        displayPosterUrl={displayPosterUrl}
        posterReady={posterReady}
        onPosterError={() => setPosterErrored(true)}
        onOpenFullscreen={() => setPosterFullscreen(true)}
      />
      <div className="movie-page__header">
        <h1 className="movie-page__title">{title}</h1>
        {(customTagline || !detailsLoading) && resolvedTagline && <h2 className="movie-item-header__desc movie-page__tagline">{resolvedTagline}</h2>}
        <div className="movie-page__subhead">
          <MoviePageSubhead
            detailsLoading={detailsLoading}
            genres={genres}
            mediaType={mediaType}
            numberOfSeasons={numberOfSeasons}
            durationMinutes={durationMinutes}
            releaseYear={resolvedReleaseYear}
            tmdbScore={resolvedTmdbScore}
            t={t}
          />
        </div>
      </div>
      <div className="movie-page__divider" />

      <MoviePageActions
        canRate={canRate}
        ownRating={ownRating}
        onRateTap={handleRateTap}
        hasGroupRatings={hasGroupRatings}
        groupRating={groupRating}
        groupExpanded={groupExpanded}
        onToggleGroupExpanded={() => { hapticTabTap(); setGroupExpanded((v) => !v); }}
        statusLoading={statusLoading}
        inList={inList}
        watched={watched}
        onToggleInList={toggleInList}
        onToggleWatched={toggleWatched}
        t={t}
      />

      {addedByMembers.length > 0 && (
        <div className="movie-page__watchlist-bar">
          <Info size={16} />
          <span>
            {t('moviePage.alsoInWatchlist', { count: addedByMembers.length })}{" "}
            {addedByMembers.map((name, i) => (
              <span key={name} className="movie-page__watchlist-member">
                {name}{i < addedByMembers.length - 1 ? ", " : ""}
              </span>
            ))}
          </span>
        </div>
      )}

      {hasGroupRatings && <MoviePageRatingsReveal groupRatings={groupRatings} groupExpanded={groupExpanded} />}

      <div className="movie-page__divider" />

      {description && (
        <MoviePageDescription
          description={description}
          descRef={descRef}
          descExpanded={descExpanded}
          descClamped={descClamped}
          onToggle={() => { hapticTabTap(); setDescExpanded((v) => !v); }}
          t={t}
        />
      )}

      <MoviePageCrew
        detailsLoading={detailsLoading}
        mediaType={mediaType}
        director={director}
        cast={cast}
        loadedCastPhotos={loadedCastPhotos}
        onPhotoSettled={handlePhotoSettled}
        onOpenActor={onOpenActor}
        t={t}
      />

      <Presence show={showGuestLimit}>
        {showGuestLimit && <GuestLimitModal onClose={() => setShowGuestLimit(false)} />}
      </Presence>
      <Presence show={showRatingModal}>
        {showRatingModal && (
          <RatingModal
            title={t('personalList.rateDialog', { title })}
            initialScore={ownRating}
            defaultMode="classic"
            cancelLabel={t('personalList.btnSkip')}
            saveLabel={t('personalList.btnSave')}
            onCancel={() => setShowRatingModal(false)}
            onSave={async (score) => {
              await setRating(score);
              setShowRatingModal(false);
            }}
          />
        )}
      </Presence>
      <Presence show={posterFullscreen}>
        {posterFullscreen && displayPosterUrl && (
          <Dialog className="movie-page__poster-fullscreen-overlay" onClose={() => { hapticTabTap(); closePoster(); }} ariaLabel={title}>
            <button
              type="button"
              className="movie-page__poster-fullscreen-close"
              aria-label={t('moviePage.closePoster')}
              onClick={() => { hapticTabTap(); setPosterFullscreen(false); }}
            >
              <X size={24} />
            </button>
            <img
              src={displayPosterUrl}
              alt={title}
              className="movie-page__poster-fullscreen-img"
            />
          </Dialog>
        )}
      </Presence>
    </div>
  );
}
