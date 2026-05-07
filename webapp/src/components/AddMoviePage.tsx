import type {User} from "../types/User.ts";
import {useEffect, useMemo, useState} from "react";
import {CirclePlus} from "lucide-react";

const MOVIES_URL = "/api/movies";
const USERS_URL = "/api/users";

type RatingForm = {
  id: string,
  userId: string,
  score: number
}

async function fetchUsers(): Promise<User[]> {
  const response = await fetch(USERS_URL);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `HTTP ${response.status}`);
  }
  return await response.json() as Promise<User[]>;
}

async function addMovie(data: {
  title: string;
  description: string;
  ownerId: string;
  ratings: { userId: string; score: number }[];
}) {
  const tg = window.Telegram?.WebApp as {
    initDataUnsafe?: { user?: { id?: number | string } }
  } | undefined;
  const tgUser = tg?.initDataUnsafe?.user?.id;
  const userHeader = tgUser !== undefined ? String(tgUser) : "";
  const response = await fetch(MOVIES_URL, {
    method: "POST",
    headers: {"Content-Type": "application/json", "User-Id": userHeader},
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error("Failed to add movie. " + response.statusText);
  }
}

const AddMoviePage = ({usersLeft, onBack}: {
  usersLeft: User[];
  onBack: () => void
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [ownerId, setOwnerId] = useState("");
  const [ratingForms, setRatingForms] = useState<RatingForm[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [error, setError] = useState<string | null>(null)
  const selectedUserIds = useMemo(() => {
    return new Set(
        ratingForms
        .map(f => f.userId)
        .filter(Boolean)
    );
  }, [ratingForms]);

  useEffect(() => {
    fetchUsers().then((u) => setUsers(u))
    .catch((err) => console.error(err));
  }, []);

  const handleAdd = async () => {
    try {
      await addMovie({
        title,
        description,
        ownerId,
        ratings: ratingForms
        .filter((f) => f.userId !== "")
        .map((f) => ({
          userId: f.userId,
          score: Number.isFinite(f.score) ? Math.min(10, Math.max(0, f.score)) : 0,
        })),
      });
      onBack();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    }
  };

  const addRatingForm = () => {
    setRatingForms([...ratingForms, {id: crypto.randomUUID(), userId: "", score: 0}]);
  }

  const updateRatingFormUser = (formId: string, userId: string) => {
    setRatingForms(ratingForms.map(form => form.id === formId
        ? {...form, userId} : form)
    );
  };

  const updateRatingFormScore = (formId: string, score: number) => {
    setRatingForms(ratingForms.map(form => form.id === formId
        ? {...form, score} : form)
    );
  };

  return (
      <section className="add-movie">
        <h1>Add Movie</h1>
        <div className="add-movie__fields">
          <div className="add-movie__item">
            <label htmlFor="add-movie-title">Title</label>
            <input id="add-movie-title" type="text" onChange={t => setTitle(t.target.value)}
                   placeholder="Title"/>
          </div>
          <div className="add-movie__item">
            <label htmlFor="add-movie-desc">Description</label>
            <input id="add-movie-desc" type="text" onChange={d => setDescription(d.target.value)}
                   placeholder="Description"/>
          </div>
          <div className="add-movie__item">
            <label htmlFor="add-movie-owner">Owner</label>
            <select id="add-movie-owner" value={ownerId} onChange={o => setOwnerId(o.target.value)}>
              <option value="" selected disabled>Host</option>
              {usersLeft.toSorted((a, b) => a.name.localeCompare(b.name)).map(user => (
                  <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </select>
          </div>
        </div>

        {ownerId &&
            <div className="add-movie__ratings">
              <label htmlFor="add-movie__ratings">Set the ratings</label>
              <div className="add-movie__ratings__user__scores">
                {
                  ratingForms.map((form) => (
                      <div key={form.id} className="add-movie__ratings__form">
                        <select onChange={(o) => updateRatingFormUser(form.id, o.target.value)}>
                          <option value="" selected disabled>Select user</option>
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
                            type="number"
                            inputMode="decimal"
                            min={0}
                            max={10}
                            step={0.01}
                            value={form.score}
                            onFocus={(e) => e.currentTarget.select()}
                            onChange={(e) => {
                              const v = e.target.valueAsNumber;
                              updateRatingFormScore(
                                  form.id,
                                  Number.isFinite(v) ? v : 0,
                              );
                            }}
                        />
                      </div>
              ))
              }
            </div>
          <div className="add-button">
          <button type="button" onClick={addRatingForm}><CirclePlus/></button>
</div>

</div>
}

  {error && (
      <span>{error}</span>
  )}
  <div className="add-movie__control">
    <button type="button" onClick={onBack}>Back</button>
    <button type="button" onClick={handleAdd}>Add</button>
  </div>
</section>
)
  ;
};

export default AddMoviePage;
