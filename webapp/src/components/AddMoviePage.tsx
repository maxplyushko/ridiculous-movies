import type {User} from "../types/User.ts";
import {useEffect, useMemo, useState} from "react";
import {CirclePlus} from "lucide-react";
import type {Movie} from "../types/Movie.ts";
import {addMovie, editMovie, type MovieFormPayload} from "../api/movies.ts";
import {fetchUsers} from "../api/users.ts";

const SCORE_MAX = 10;

type RatingForm = {
  id: string;
  userId: string;
  scoreInput: string;
};

function parseScoreInput(raw: string): number {
  const t = raw.trim();
  if (t === "") {
    return 0;
  }
  const normalized = t.replace(",", ".");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : 0;
}

const AddMoviePage = ({
  currentRound,
  movie,
  onBack,
}: {
  currentRound: number;
  movie?: Movie;
  onBack: () => void;
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [ownerId, setOwnerId] = useState("");
  const [round, setRound] = useState(currentRound);
  const [ratingForms, setRatingForms] = useState<RatingForm[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const isEditMode = movie !== undefined;

  const selectedUserIds = useMemo(() => {
    return new Set(
        ratingForms
        .map(f => f.userId)
        .filter(Boolean)
    );
  }, [ratingForms]);

  useEffect(() => {
    fetchUsers()
    .then(setUsers)
    .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    if (!movie) {
      setRound(currentRound);
    }
  }, [currentRound, movie]);

  useEffect(() => {
    if (!movie) {
      return;
    }
    setTitle(movie.title);
    setDescription(movie.description);
    setOwnerId(movie.owner.id);
    setRatingForms(
        movie.ratings.map((rating) => ({
          id: crypto.randomUUID(),
          userId: rating.user.id,
          scoreInput: String(rating.score),
        }))
    );
  }, [movie]);

  const buildPayload = (): MovieFormPayload => ({
    title,
    description,
    ownerId,
    ...(isEditMode ? {} : {round}),
    ratings: ratingForms
    .filter((f) => f.userId !== "")
    .map((f) => {
      const n = parseScoreInput(f.scoreInput);
      return {
        userId: f.userId,
        score: Math.min(SCORE_MAX, Math.max(0, n)),
      };
    }),
  });

  const handleSubmit = async () => {
    try {
      const payload = buildPayload();
      if (movie) {
        await editMovie(movie.id, payload);
      } else {
        await addMovie(payload);
      }
      onBack();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    }
  };

  const addRatingForm = () => {
    setRatingForms([...ratingForms, {id: crypto.randomUUID(), userId: "", scoreInput: "0"}]);
  };

  const updateRatingFormUser = (formId: string, userId: string) => {
    setRatingForms(ratingForms.map(form => form.id === formId
        ? {...form, userId} : form)
    );
  };

  const updateRatingFormScoreInput = (formId: string, scoreInput: string) => {
    setRatingForms(ratingForms.map(form => form.id === formId
        ? {...form, scoreInput} : form)
    );
  };

  return (
      <section className="add-movie">
        <h1>{isEditMode ? "Edit Movie" : "Add Movie"}</h1>
        <div className="add-movie__fields">
          <div className="add-movie__item">
            <label htmlFor="add-movie-title">Title</label>
            <input id="add-movie-title" type="text" value={title} onChange={t => setTitle(t.target.value)}
                   placeholder="Title"/>
          </div>
          <div className="add-movie__item">
            <label htmlFor="add-movie-desc">Description</label>
            <input id="add-movie-desc" type="text" value={description} onChange={d => setDescription(d.target.value)}
                   placeholder="Description"/>
          </div>
          <div className="add-movie__item">
            <label htmlFor="add-movie-owner">Owner</label>
            <select id="add-movie-owner" value={ownerId} onChange={o => setOwnerId(o.target.value)}>
              <option value="" disabled>Host</option>
              {users.toSorted((a, b) => a.name.localeCompare(b.name)).map(user => (
                  <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </select>
          </div>
          {!isEditMode && (
              <div className="add-movie__item">
                <label htmlFor="add-movie-round">Round</label>
                <select
                    id="add-movie-round"
                    value={round}
                    onChange={(e) => setRound(Number(e.target.value))}
                >
                  <option value={currentRound}>Round {currentRound}</option>
                  <option value={currentRound + 1}>Round {currentRound + 1}</option>
                </select>
              </div>
          )}
        </div>

        {ownerId && (
            <div className="add-movie__ratings" aria-labelledby="add-movie-ratings-heading">
              <p id="add-movie-ratings-heading" className="add-movie__ratings__title">
                Set the ratings
              </p>
              <div className="add-movie__ratings__user__scores">
                {ratingForms.map((form) => (
                    <div key={form.id} className="add-movie__ratings__form">
                      <select
                          value={form.userId}
                          onChange={(o) => updateRatingFormUser(form.id, o.target.value)}
                          aria-label="User"
                      >
                        <option value="" disabled>Select user</option>
                        {users.toSorted((a, b) => a.name.localeCompare(b.name))
                        .filter(user =>
                            ownerId !== user.id &&
                            (
                                !selectedUserIds.has(user.id) ||
                                user.id === form.userId
                            )
                        )
                        .map(user => (
                            <option key={user.id} value={user.id}>{user.name}</option>
                        ))}
                      </select>
                      <input
                          className="add-movie__ratings__score"
                          type="text"
                          inputMode="decimal"
                          autoComplete="off"
                          value={form.scoreInput}
                          onFocus={(e) => e.currentTarget.select()}
                          onChange={(e) => updateRatingFormScoreInput(form.id, e.target.value)}
                          aria-label="Score"
                          placeholder={`0–${SCORE_MAX}`}
                      />
                    </div>
                ))}
              </div>
              <div className="add-button">
                <button type="button" onClick={addRatingForm} aria-label="Add rating row">
                  <CirclePlus/>
                </button>
              </div>
            </div>
        )}

        {error && (
            <span className="add-movie__error">{error}</span>
        )}
        <div className="add-movie__control">
          <button type="button" onClick={onBack}>Back</button>
          <button type="button" onClick={handleSubmit}>{isEditMode ? "Save" : "Add"}</button>
        </div>
      </section>
  );
};

export default AddMoviePage;
