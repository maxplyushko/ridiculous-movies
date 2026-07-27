import { useLayoutEffect, useRef, useState } from "react";
import { Calendar, ChevronDown, ChevronUp, MapPin, User } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useTmdbActor } from "@/hooks/useTmdbActor.ts";
import { PageBackButton } from "@/components/PageBackButton.tsx";
import { hapticTabTap } from "@/utils/haptics.ts";

type ActorPageProps = {
  personId: number;
  onBack: () => void;
};

export function ActorPage({ personId, onBack }: Readonly<ActorPageProps>) {
  const { t } = useTranslation();
  const { actor, loading } = useTmdbActor(personId);
  const bioRef = useRef<HTMLParagraphElement | null>(null);
  const [bioExpanded, setBioExpanded] = useState(false);
  const [bioClamped, setBioClamped] = useState(false);
  const [photoLoaded, setPhotoLoaded] = useState(false);

  const knownFor = actor?.knownFor ?? [];

  useLayoutEffect(() => {
    const el = bioRef.current;
    if (!el) return;
    setBioClamped(el.scrollHeight > el.clientHeight + 1);
  }, [actor?.biography]);

  return (
    <div className="movie-page actor-page">
      <div className="movie-page__poster-wrap">
        <PageBackButton onBack={onBack} />
        <div
          className="movie-page__poster-backdrop"
          style={actor?.profileUrl ? { backgroundImage: `url(${actor.profileUrl})` } : undefined}
        />
        <div className="movie-page__poster actor-page__photo">
          {loading && <div className="movie-page__poster-skeleton sk-card" />}
          {!loading && actor?.profileUrl && (
            <img
              src={actor.profileUrl}
              alt={actor.name}
              decoding="async"
              className={photoLoaded ? "movie-page__poster-img--loaded" : ""}
              onLoad={() => setPhotoLoaded(true)}
              onError={() => setPhotoLoaded(true)}
            />
          )}
          {!loading && !actor?.profileUrl && (
            <div className="actor-page__photo-fallback"><User size={40} /></div>
          )}
        </div>
      </div>

      <div className="movie-page__header">
        <h1 className="movie-page__title">{loading ? "" : actor?.name}</h1>
        {!loading && (actor?.birthday || actor?.placeOfBirth) && (
          <div className="movie-page__meta">
            {actor?.birthday && <span><Calendar size={14} />{actor.birthday}</span>}
            {actor?.placeOfBirth && <span><MapPin size={14} />{actor.placeOfBirth}</span>}
          </div>
        )}
      </div>

      <div className="movie-page__divider" />

      {!loading && actor?.biography && (
        <div className="movie-page__description-block">
          <p className="movie-page__section-title">{t('actorPage.biography')}</p>
          <p
            ref={bioRef}
            className={`movie-page__description${!bioExpanded ? " movie-page__description--clamped" : ""}`}
          >
            {actor.biography}
          </p>
          {bioClamped && (
            <button
              type="button"
              className="movie-page__description-toggle"
              aria-label={bioExpanded ? t('actorPage.collapse') : t('actorPage.expand')}
              onClick={() => { hapticTabTap(); setBioExpanded((v) => !v); }}
            >
              {bioExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
          )}
        </div>
      )}

      {!loading && knownFor.length > 0 && (
        <div className="movie-page__crew">
          <p className="movie-page__section-title">{t('actorPage.knownFor')}</p>
          <div className="actor-page__known-for-list">
            {knownFor.map((m) => (
              <div className="actor-page__known-for-item" key={m.id}>
                <div className="actor-page__known-for-poster">
                  {m.posterUrl ? <img src={m.posterUrl} alt={m.title} loading="lazy" decoding="async" /> : null}
                </div>
                <span className="actor-page__known-for-title">{m.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
