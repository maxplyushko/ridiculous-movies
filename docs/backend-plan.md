# Backend plan (adjusted)

## Stack

- Spring Boot 4, JPA, PostgreSQL (Docker), Flyway (`validate` + migrations).

## Schema

- **`app_user`**: `id`, `name` (unique).
- **`movie`**: `id`, `title`, `description`, **`owner_id`** (FK → user; Excel column A), **`created_at`**, **`updated_at`** (maintained by app on write; seed uses `NOW()`).
- **`rating`**: `movie_id`, `user_id`, `score`; unique `(movie_id, user_id)`.

## REST API

| Method | Path | Behaviour |
|--------|------|-------------|
| `GET` | `/api/movies` | List movies. Each item includes **`id`**, `title`, `description`, **`createdAt`**, **`updatedAt`**, **`owner`**, **`averageRating`**, **`ratings`** (user + score). |
| `GET` | `/api/movies?filter=top_rating` | Movies tied for **highest** average (among rows matching filters). |
| `GET` | `/api/movies?filter=lowest_rating` | Movies tied for **lowest** average (same filters). |
| `GET` | `/api/users?sort=desc` | Users with **`averageRatingGiven`**, **`ratingCount`**; sort by average given (default `desc`). |

**Query params** (for `filter=top_rating` / `lowest_rating` and optional on list):

- **`sort`** — `asc` \| `desc` (default **`desc`**). Orders the returned movies by **`averageRating`** (movies with no ratings sort last), then by **`id`**. Use **`sort`** for ordering; **`filter`** only selects which movies are included (`all` / `top_rating` / `lowest_rating`).
- `minRatings` (default `1`) — minimum number of ratings on the movie.
- `requireAllUsers` (default `false`) — if `true`, only movies with exactly five ratings.

**Errors**: `404` when `filter` is `top_rating` / `lowest_rating` and no movie qualifies.

**Note**: Replaces separate `/highest` and `/lowest` paths with **`filter`** on `/api/movies`.

## Ops

- **`docker-compose.yml`**: **Postgres** (port `5432`) and **backend** (port **`8080`**, image built from [`backend/Dockerfile`](../backend/Dockerfile)). DB credentials **`ridiculous` / `ridiculous` / `ridiculous`**; the backend container uses `SPRING_DATASOURCE_URL=jdbc:postgresql://db:5432/ridiculous`. Local runs without Compose still default to [`application.properties`](../backend/src/main/resources/application.properties) (`localhost`).
- **JDK**: build targets **Java 21** (see [`backend/pom.xml`](../backend/pom.xml)); adjust locally if you use another LTS.
- **No frontend changes** in this repo scope.
