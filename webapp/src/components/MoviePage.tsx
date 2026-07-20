import { useLayoutEffect, useRef, useState } from "react";
import { Bookmark, Calendar, ChevronDown, ChevronUp, Clapperboard, Clock, Loader, Star, Tv, User, UserStar } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Movie } from "@/features/group/types/Movie";
import type { PersonalMovie } from "@/features/personal/types/PersonalMovie";
import type { TmdbMovie } from "@/types/TmdbMovie";
import { useTmdbMovieDetails } from "@/hooks/useTmdbMovieDetails.ts";
import { PageBackButton } from "@/components/PageBackButton.tsx";
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
  onRate?: () => void;
  onAddToPersonalList?: () => void;
};

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function MoviePage({ source, currentUserId, onBack, onRate, onAddToPersonalList }: Readonly<MoviePageProps>) {
  const { t } = useTranslation();
  const tmdbId = source.kind === "tmdb" ? source.movie.id : source.movie.tmdbId;
  const mediaType = source.kind === "tmdb"
    ? source.movie.mediaType
    : (source.movie.tmdbMediaType ?? "movie");
  const { details, loading: detailsLoading } = useTmdbMovieDetails(tmdbId, mediaType);
  const descRef = useRef<HTMLParagraphElement | null>(null);
  const [descExpanded, setDescExpanded] = useState(false);
  const [descClamped, setDescClamped] = useState(false);
  const [loadedCastPhotos, setLoadedCastPhotos] = useState<Record<string, boolean>>({});

  const title = source.movie.title;
  const description = source.kind === "tmdb" ? source.movie.overview : source.movie.description;
  const posterUrl = source.kind === "tmdb" ? source.movie.posterUrl : (details?.posterUrl ?? null);
  const displayPosterUrl = posterUrl ?? noPosterFallback;
  const tmdbScore = source.kind === "tmdb" ? source.movie.tmdbScore : details?.tmdbScore;
  const releaseYear = source.kind === "tmdb" ? source.movie.releaseYear : details?.releaseYear;
  const groupRating = source.kind === "group" ? source.movie.averageRating : null;
  const tagline = details?.tagline ?? null;
  const numberOfSeasons = details?.numberOfSeasons ?? null;
  const durationMinutes = details?.durationMinutes ?? null;
  const genres = details?.genres ?? [];
  const director = details?.director ?? null;
  const cast = details?.cast ?? [];
  const [loadedPosters, setLoadedPosters] = useState<Record<string, boolean>>({});
  const posterLoaded = !!loadedPosters[displayPosterUrl];

  const alreadyRated = source.kind === "group"
    ? source.movie.ratings.some((r) => r.user.id === currentUserId)
    : source.kind === "personal" && source.movie.rating != null;

  const hasRatingsList = source.kind === "group"
    ? source.movie.ratings.length > 0
    : source.kind === "personal" && source.movie.rating != null;
  const hasActionBlock = source.kind === "tmdb"
    ? !!onAddToPersonalList
    : hasRatingsList || (!!onRate && !alreadyRated);

  useLayoutEffect(() => {
    const el = descRef.current;
    if (!el) return;
    setDescClamped(el.scrollHeight > el.clientHeight + 1);
  }, [description]);

  return (
    <div className="movie-page">
      <div className="movie-page__poster-wrap">
        <PageBackButton onBack={onBack} />
        <div className="movie-page__poster-backdrop" style={{ backgroundImage: `url(${displayPosterUrl})` }} />
        <div className="movie-page__poster">
          <img
            src={displayPosterUrl}
            alt={title}
            decoding="async"
            className={posterLoaded ? "movie-page__poster-img--loaded" : ""}
            onLoad={() => setLoadedPosters((prev) => ({ ...prev, [displayPosterUrl]: true }))}
            onError={() => setLoadedPosters((prev) => ({ ...prev, [displayPosterUrl]: true }))}
          />
        </div>
      </div>
      <div className="movie-page__header">
        <h1 className="movie-page__title">{title}</h1>
        <div className="movie-page__subhead">
          {detailsLoading ? (
            <div className="movie-page__meta-skeleton">
              <div className="sk-line movie-page__sk-genres" />
              <div className="movie-page__meta">
                <div className="sk-line movie-page__sk-chip" />
                <div className="sk-line movie-page__sk-chip" />
                <div className="sk-line movie-page__sk-chip" />
              </div>
            </div>
          ) : (
            <>
              {tagline && <p className="movie-item-header__desc">{tagline}</p>}
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
                {groupRating != null && <span><UserStar size={14} />{groupRating.toFixed(1)}</span>}
                {!!tmdbScore && <span><Star size={14} />{tmdbScore.toFixed(1)}</span>}
              </div>
            </>
          )}
        </div>
      </div>
      {hasActionBlock && <div className="movie-page__divider" />}

      {source.kind === "tmdb" ? (
        onAddToPersonalList && (
          <button
            type="button"
            className="movie-page__add-btn"
            onClick={() => { hapticTabTap(); onAddToPersonalList(); }}
          >
            <Bookmark size={16} />
            {t('moviePage.btnAddToPersonalList')}
          </button>
        )
      ) : (
        <div className="movie-page__app-rating">
          {(source.kind === "group" ? source.movie.ratings.length > 0 : source.movie.rating != null) && (
            <p className="movie-page__section-title">{t('moviePage.ratings')}</p>
          )}
          {source.kind === "group" ? (
            <div className="movie-item-details__ratings">
              {[...source.movie.ratings]
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
          ) : (
            source.movie.rating != null && (
              <div className="movie-item-details__ratings">
                <span className="movie-item-details__rating-item">
                  <User size={16} /> {t('moviePage.you')}: {source.movie.rating.toFixed(1)}
                </span>
              </div>
            )
          )}
          {onRate && !alreadyRated && (
            <button
              type="button"
              className="movie-item-details__rate-btn"
              onClick={() => { hapticTabTap(); onRate(); }}
            >
              {t('moviePage.btnRate')}
            </button>
          )}
        </div>
      )}

      <div className="movie-page__divider" />

      {description && (
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
              onClick={() => { hapticTabTap(); setDescExpanded((v) => !v); }}
            >
              {descExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
          )}
        </div>
      )}
      {detailsLoading && (
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
      )}
      {!detailsLoading && (director || cast.length > 0) && (
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
                  const photoLoaded = loadedCastPhotos[photoKey];
                  return (
                  <div className="movie-page__cast-item" key={photoKey}>
                    <div className="movie-page__cast-photo">
                      {c.profileUrl
                        ? (
                          <>
                            {!photoLoaded && <Loader size={18} className="movie-page__cast-photo-spinner" />}
                            <img
                              src={c.profileUrl}
                              alt={c.name}
                              loading="lazy"
                              decoding="async"
                              className={photoLoaded ? "" : "movie-page__cast-photo-img--hidden"}
                              onLoad={() => setLoadedCastPhotos((prev) => ({ ...prev, [photoKey]: true }))}
                              onError={() => setLoadedCastPhotos((prev) => ({ ...prev, [photoKey]: true }))}
                            />
                          </>
                        )
                        : <User size={24} />}
                    </div>
                    <span className="movie-page__cast-name">{c.name}</span>
                    {c.character && <span className="movie-page__cast-character">{c.character}</span>}
                  </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
