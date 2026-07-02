import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import type { PersonalMovie } from "../types/PersonalMovie.ts";
import { addPersonalMovie, editPersonalMovie, type PersonalMoviePayload } from "../api/personalList.ts";
import { useTelegramMainButton } from "@/hooks/useTelegramButtons.ts";
import { PageBackButton } from "@/components/PageBackButton.tsx";
import { RatingEditor } from "@/components/RatingEditor.tsx";
import { calcDetailedScore, type DetailedScores, type RatingMode } from "@/hooks/useRatingForm.ts";
import { isTelegramMiniApp } from "@/lib/telegram/telegram.ts";
import { useTmdbSearch } from "@/hooks/useTmdbSearch.ts";
import scrollIntoViewAfterKeyboard from "@/hooks/useScrollIntoViewOnKeyboard.ts";
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
  const initRating = movie?.rating != null && movie.rating > 0 ? Math.round(movie.rating) : null;
  const [ratingMode, setRatingMode] = useState<RatingMode>("detailed");
  const [detailedRating, setDetailedRating] = useState<DetailedScores>(
    initRating ? { r1: initRating, r2: initRating, r3: initRating } : { r1: null, r2: null, r3: null }
  );
  const [classicRating, setClassicRating] = useState<number | null>(initRating);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [proposedOverview, setProposedOverview] = useState<string | null>(null);

  const { results: suggestions } = useTmdbSearch(showSuggestions ? title : "", { minLen: 2, debounceMs: 200 });
  const isTg = isTelegramMiniApp();
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
        rating: isEditMode ? rating : null,
      };
      if (movie) {
        await editPersonalMovie(movie.id, { ...payload, watched: movie.watched });
      } else {
        await addPersonalMovie(payload);
      }
      onBack();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSubmitDisabled = isSubmitting || !title.trim();
  const submitLabel = isEditMode ? t('addPersonal.btnSave') : t('addPersonal.btnAdd');

  useTelegramMainButton(submitLabel, handleSubmit, isSubmitDisabled, isSubmitting);

  return (
    <section className="add-movie">
      <PageBackButton onBack={onBack} />
      <h1>{isEditMode ? t('addPersonal.headingEdit') : t('addPersonal.headingAdd')}</h1>
      <div className="add-movie__fields">
        <div className="add-movie__item">
          <input
            id="pl-movie-title"
            type="text"
            value={title}
            onChange={(e) => { setTitle(e.target.value); setShowSuggestions(true); }}
            onFocus={(e) => { setShowSuggestions(true); scrollIntoViewAfterKeyboard(e.currentTarget); }}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 300)}
            placeholder=" "
            autoComplete="off"
          />
          <label htmlFor="pl-movie-title">{t('addPersonal.labelTitle')}</label>
          {showSuggestions && suggestions.length > 0 && (
            <ul className="title-suggestions">
              {suggestions.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => { setTitle(s.title); if (s.overview) setProposedOverview(s.overview); setShowSuggestions(false); }}
                  >
                    <span className="title-suggestions__title">{s.title}</span>
                    {s.releaseYear && <span className="title-suggestions__year">{s.releaseYear}</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="add-movie__item">
          <input
            id="pl-movie-desc"
            type="text"
            value={description}
            onChange={(e) => { setDescription(e.target.value); setProposedOverview(null); }}
            onFocus={(e) => { scrollIntoViewAfterKeyboard(e.currentTarget); }}
            placeholder=" "
          />
          <label htmlFor="pl-movie-desc">{t('addPersonal.labelDescription')}</label>
          {proposedOverview && (
            <div className="overview-proposal">
              <span className="overview-proposal__text">{proposedOverview}</span>
              <div className="overview-proposal__actions">
                <button type="button" onClick={() => setProposedOverview(null)}>{t('addPersonal.btnDismiss')}</button>
                <button type="button" onClick={() => { setDescription(proposedOverview); setProposedOverview(null); }}>{t('addPersonal.btnUse')}</button>
              </div>
            </div>
          )}
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
      {!isTg && (
        <div className="add-movie__control">
          <button type="button" onClick={handleSubmit} disabled={isSubmitDisabled}>
            {isSubmitting ? <Loader2 className="add-movie__spinner" size={16} /> : submitLabel}
          </button>
        </div>
      )}
    </section>
  );
};

export default AddPersonalMoviePage;
