import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import type { PersonalMovie } from "../types/PersonalMovie.ts";
import { addPersonalMovie, editPersonalMovie, type PersonalMoviePayload } from "../api/personalList.ts";
import { useHideBottomBar } from "@/hooks/useSubPage.ts";
import { PageBackButton } from "@/components/PageBackButton.tsx";
import { GuestLimitModal } from "@/components/GuestLimitModal.tsx";
import { Presence } from "@/components/Presence.tsx";
import { RatingEditor } from "@/components/RatingEditor.tsx";
import { TmdbTitleField } from "@/components/TmdbTitleField.tsx";
import { calcDetailedScore, type DetailedScores, type RatingMode } from "@/hooks/useRatingForm.ts";
import { hapticTabTap } from "@/utils/haptics.ts";

type AddPersonalMoviePageProps = {
  movie?: PersonalMovie;
  onBack: () => void;
};

const AddPersonalMoviePage = ({ movie, onBack }: AddPersonalMoviePageProps) => {
  const { t } = useTranslation();
  const isEditMode = movie !== undefined;
  const [title, setTitle] = useState(movie?.title ?? "");
  const [description, setDescription] = useState(movie?.description ?? "");
  const [tagline, setTagline] = useState(movie?.tagline ?? "");
  const initRating = movie?.rating != null && movie.rating > 0 ? movie.rating : null;
  const [ratingMode, setRatingMode] = useState<RatingMode>("detailed");
  const [detailedRating, setDetailedRating] = useState<DetailedScores>(
    initRating ? { r1: initRating, r2: initRating, r3: initRating } : { r1: null, r2: null, r3: null }
  );
  const [classicRating, setClassicRating] = useState<number | null>(initRating);
  const [tmdbId, setTmdbId] = useState<number | undefined>(movie?.tmdbId);
  const [tmdbMediaType, setTmdbMediaType] = useState(movie?.tmdbMediaType);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showGuestLimit, setShowGuestLimit] = useState(false);
  const rating = ratingMode === "detailed" ? calcDetailedScore(detailedRating) : classicRating;

  const toggleRatingMode = () => {
    hapticTabTap();
    const next = ratingMode === "detailed" ? "classic" : "detailed";
    if (next === "classic") {
      const s = calcDetailedScore(detailedRating);
      if (s !== null) setClassicRating(Math.round(s));
    } else if (classicRating !== null) {
      setDetailedRating({ r1: classicRating, r2: classicRating, r3: classicRating });
    }
    setRatingMode(next);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const payload: PersonalMoviePayload = {
        title,
        description,
        tagline,
        rating: isEditMode ? rating : null,
        tmdbId,
        tmdbMediaType,
      };
      if (movie) {
        await editPersonalMovie(movie.id, { ...payload, watched: movie.watched });
      } else {
        await addPersonalMovie(payload);
      }
      onBack();
    } catch (e) {
      if (e instanceof Error && e.message === "GUEST_LIMIT_REACHED") {
        setShowGuestLimit(true);
      } else if (e instanceof Error && e.message === "PERSONAL_MOVIE_DUPLICATE") {
        setError(t('addPersonal.errorDuplicate'));
      } else {
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSubmitDisabled = isSubmitting || !title.trim();
  const submitLabel = isEditMode ? t('addPersonal.btnSave') : t('addPersonal.btnAdd');

  useHideBottomBar();

  return (
    <section className="add-movie">
      <PageBackButton onBack={onBack} />
      <h1>{isEditMode ? t('addPersonal.headingEdit') : t('addPersonal.headingAdd')}</h1>
      <div className="add-movie__fields">
        <TmdbTitleField
          id="pl-movie-title"
          label={t('addPersonal.labelTitle')}
          title={title}
          onTitleChange={(value) => { setTitle(value); setTmdbId(undefined); setTmdbMediaType(undefined); }}
          onSelect={({ tmdbId: id, mediaType, description: overview }) => {
            setTmdbId(id);
            setTmdbMediaType(mediaType);
            if (overview) setDescription(overview);
          }}
          onTagline={setTagline}
        />
        <div className="add-movie__item">
          <input
            id="pl-movie-tagline"
            type="text"
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            placeholder=" "
          />
          <label htmlFor="pl-movie-tagline">{t('addPersonal.labelTagline')}</label>
        </div>
        <div className="add-movie__item">
          <input
            id="pl-movie-desc"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder=" "
          />
          <label htmlFor="pl-movie-desc">{t('addPersonal.labelDescription')}</label>
        </div>
      </div>

      {isEditMode && (
        <div className="add-movie__ratings">
          <p className="add-movie__ratings__title">{t('addPersonal.sectionMyRating')}</p>
          <div className="rating-card">
            <RatingEditor
              mode={ratingMode}
              detailed={detailedRating}
              classicValue={classicRating}
              onToggleMode={toggleRatingMode}
              onDetailedChange={(field, value) => setDetailedRating((prev) => ({ ...prev, [field]: value }))}
              onClassicChange={setClassicRating}
            />
          </div>
        </div>
      )}

      {error && <span className="add-movie__error">{error}</span>}
      <div className="add-movie__control">
        <button type="button" onClick={handleSubmit} disabled={isSubmitDisabled}>
          {isSubmitting ? <Loader2 className="add-movie__spinner" size={16} /> : submitLabel}
        </button>
      </div>
      <Presence show={showGuestLimit}>
        {showGuestLimit && <GuestLimitModal onClose={() => setShowGuestLimit(false)} />}
      </Presence>
    </section>
  );
};

export default AddPersonalMoviePage;
