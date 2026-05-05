CREATE TABLE app_user (
    id   BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE movie (
    id          BIGSERIAL PRIMARY KEY,
    title       TEXT        NOT NULL,
    description TEXT        NOT NULL DEFAULT '',
    owner_id    BIGINT      NOT NULL REFERENCES app_user (id),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE rating (
    id       BIGSERIAL PRIMARY KEY,
    movie_id BIGINT NOT NULL REFERENCES movie (id) ON DELETE CASCADE,
    user_id  BIGINT NOT NULL REFERENCES app_user (id),
    score    NUMERIC(5, 2) NOT NULL,
    UNIQUE (movie_id, user_id)
);

CREATE INDEX idx_rating_movie ON rating (movie_id);
CREATE INDEX idx_rating_user ON rating (user_id);
