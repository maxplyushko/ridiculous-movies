/# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Telegram Mini App for a private movie club. Members add films by round, rate each other's picks, and browse stats. Spring Boot 4 backend + React/Vite frontend.

## Development Guidelines

All new features and UI/UX changes must be fully consistent with existing patterns:
- **Components**: mirror structure, props, and state management of analogous existing components
- **Haptics**: `hapticTabTap` on every interactive tap (buttons, toggles, checkboxes); spin/reveal haptics only for spinner
- **Swipe actions**: reuse `useSwipeGesture` with same `ACTIONS_WIDTH`/`OPEN_THRESHOLD` constants; clicking outside open swipe must close it
- **CSS**: reuse existing classes (`mlp__*`, `movie-item-*`, `rating-card__*`, etc.) before adding new ones
- **Icons**: lucide-react only, consistent sizing (`size={30}` nav, `size={20}` cards, `size={16}` inline)
- **API layer**: all calls through `apiFetch` in `webapp/src/api/client.ts`; feature API modules are colocated under `features/*/api/` (e.g. `features/group/api/movies.ts`) — mirror the nearest existing one
- **Backend**: new controllers/DTOs follow `MovieController`/`MovieResponse` pattern; storage via `DataStore` with read/write lock + `persist()`
- **i18n**: all user-visible strings via `useTranslation()` hook; add keys to both `webapp/src/lib/i18n/locales/en.json` and `ru.json`

## Testing

Don't start the backend or frontend dev servers to test changes — user tests UI/UX manually. Verify via build/lint/unit tests only (`npm run build`, `npm run lint`, `./mvnw test`).

## Commands

### Backend (run from `backend/`)
```bash
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev   # start with local JSON storage
./mvnw test                     # run all tests
./mvnw test -Dtest=ClassName    # run single test class
./mvnw package -DskipTests      # build fat JAR
```

### Frontend (run from `webapp/`)
```bash
npm run dev          # dev server with API proxy to localhost:8080
npm run build        # compile TS + bundle → output to backend/src/main/resources/static/
npm run lint         # ESLint
```

## Architecture

**Serving**: The backend serves the React SPA as static files from `src/main/resources/static/`. `npm run build` writes directly there. No separate frontend server in production.

**Auth** (JWT-based):
1. On load, `AuthGate` attempts auth based on environment:
   - **Telegram MiniApp**: `POST /api/auth/telegram` with `tg.initData` → receives JWT
   - **Google OAuth flow**: `GET /api/auth/google/url` → redirect → `/api/auth/google/callback` → redirect with token param → `GET /api/auth/google/token` → JWT
   - **Google ID token**: `POST /api/auth/login` with `idToken` → JWT
   - **Guest**: `POST /api/auth/guest` (requires a user with id `"guest"` in the data file)
2. JWT stored in localStorage as `rm_access_token`, sent as `Authorization: Bearer <token>`
3. `BearerTokenFilter` validates the JWT and injects the user ID as a `User-Id` header — controllers read `User-Id`, never the raw token
4. `GET /api/auth` validates the current token and returns session info
5. Users auto-register on first Google login into `google.default-group` (default: `"Guest group"`)
6. `jwt.secret` property controls signing key — if blank, a random key is generated (tokens invalidated on restart)

**Local dev auth**: Without Telegram, the sign-in screen appears. Use guest login (requires `"guest"` user in `scripts/data.json`) or Google OAuth.

**Roles & groups**: Each user has a `role` (`user` or `admin`) and belongs to a `user_group`. Movies and stats are scoped to the caller's group. Only admins can delete movies they don't own.

**Storage**: No SQL database. All data lives in a JSON file (`AppData`), loaded into memory at startup by `DataStoreInitializer`, held in `DataStore` with a `ReentrantReadWriteLock`. Every write rebuilds the full `AppData` object and calls `driveClient.upload()`.
- **Dev** (`@Profile("dev")`): `LocalFileStorageClient` reads/writes `scripts/data.json`
- **Prod** (`@Profile("prod")`): `GoogleDriveClient` reads/writes a Google Drive file (ID from `GOOGLE_DRIVE_FILE_ID`)

**Frontend API layer**: `webapp/src/api/client.ts` wraps `fetch` — injects `Authorization: Bearer <token>` from localStorage. Feature-scoped API modules live under `webapp/src/features/*/api/` and all call through `apiFetch`. Vite proxies `/api` to the backend in dev.

**Frontend routing**: Single-page, tab-based. `App.tsx` renders `AppShell` inside `AuthGate`. Four tabs: Stats, Group List, Personal List, Profile. Tab state lives in `App`; each page is always mounted but `hidden` when inactive.

**Personal list**: Per-user private watchlist (`PersonalListPage`, `/api/personal-list`). Items carry two **independent** booleans — `inList` (in the "to watch" list) and `watched` — plus an optional `rating`. A movie can be watched without being listed, and vice-versa; a record is deleted once both flags are false and no rating remains. `inList` is nullable in storage: legacy records (no field) deserialize as `null` and are treated as `true`. Stored in `DataStore.personalMoviesById`, keyed by user ID — fully isolated from group movies. `MovieDetail` (`MoviePage.tsx`) surfaces these as a shared icon action row (rate star, group-rating badge, bookmark=`inList`, eye=`watched`) that acts on the **caller's own** record via `GET /status` + `PUT /state`, consistent across every source (group / personal / TMDB / member).

**i18n**: `react-i18next`, locales in `webapp/src/lib/i18n/locales/`. Language resolved from `AuthResponse.lang`, stored in `i18n-lang` localStorage key. Default `"en"`, fallback `"en"`.

**Telegram bot**: Webhook at `/api/telegram/webhook` (secret-verified). Only handles `/start` — sends a Mini App launch button. Bot only activates when `telegram.bot.token` property is set (`@ConditionalOnProperty`).

**TMDB**: Movie search via TMDB API (`GET /api/tmdb/search?query=`). Proxied through backend to keep the API key server-side. Requires `TMDB_API_KEY` env var.

**Ratings**: `CreateMovieRequest`/`UpdateMovieRequest` accept a full `ratings` list (used for movie creation and non-rating edits). Single-user rating submission goes through `PUT /api/movies/{id}/rating` (`RateMovieRequest{score}`) — a dedicated per-user upsert handled entirely inside `DataStore.rateMovie` under one write-lock acquisition, avoiding the lost-update race a full-list replace has under concurrent raters.

**Deployment**: Hosted on Render (free tier). GitHub Actions workflow (`ping-render.yml`) hits the health endpoint every 5 minutes on Thursday evenings to keep the instance warm during movie club sessions.

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/start` | Health/startup check |
| GET | `/api/auth` | Verify token, return user info |
| POST | `/api/auth/telegram` | Login with Telegram `initData` → JWT |
| POST | `/api/auth/login` | Login with Google ID token → JWT |
| POST | `/api/auth/guest` | Login as guest → JWT |
| GET | `/api/auth/google/url` | Get Google OAuth redirect URL |
| GET | `/api/auth/google/callback` | OAuth redirect callback (server-side) |
| GET | `/api/auth/google/token` | Exchange one-time token → JWT |
| GET | `/api/movies` | List movies (params: `filter`, `sort`, `minRatings`, `requireAllUsers`) |
| GET | `/api/movies/groups` | List movies grouped by round |
| POST | `/api/movies` | Create movie (with optional ratings) |
| PUT | `/api/movies/{id}` | Update movie (with optional ratings) |
| PUT | `/api/movies/{id}/rating` | Rate a movie (single-user upsert, concurrency-safe) |
| DELETE | `/api/movies/{id}` | Delete movie (admin or owner) |
| GET | `/api/personal-list` | List caller's personal watchlist |
| POST | `/api/personal-list` | Add item to personal watchlist |
| PUT | `/api/personal-list/{id}` | Update personal watchlist item |
| DELETE | `/api/personal-list/{id}` | Remove personal watchlist item |
| GET | `/api/personal-list/status` | Caller's own record for a movie (by `tmdbId`/`title`), `204` if none |
| PUT | `/api/personal-list/state` | Upsert caller's `inList`/`watched`/`rating` for a movie; deletes record when all cleared |
| GET | `/api/personal-list/added-by` | Group members who have a movie in their watchlist |
| GET | `/api/personal-list/user/{targetId}` | List another member's watchlist (if public) |
| GET | `/api/stats` | Group stats |
| GET | `/api/users` | List users in caller's group |
| PUT | `/api/users/me/preferences` | Update caller's preferences (theme, defaultPage, lang) |
| GET | `/api/tmdb/search` | Search TMDB for movies |
| GET | `/api/tmdb/movie/{id}` | Fetch full TMDB movie detail (poster, director, cast) |
| POST | `/api/telegram/webhook` | Telegram bot webhook |

## Key env vars

| Var | Where | Purpose |
|-----|-------|---------|
| `jwt.secret` | backend | JWT signing key (random per-restart if blank) |
| `jwt.expiry-days` | backend | JWT lifetime in days (default 30) |
| `google.default-group` | backend | Group for auto-registered Google users (default `"Guest group"`) |
| `VITE_GOOGLE_CLIENT_ID` | `webapp/.env` | Google OAuth client ID |
| `TELEGRAM_BOT_TOKEN` | backend env | Required to enable the bot |
| `TELEGRAM_WEBHOOK_URL` | backend env | Must be set to public URL for webhook |
| `GOOGLE_DRIVE_FILE_ID` | backend env | Google Drive file used as prod database |
| `TMDB_API_KEY` | backend env | TMDB Bearer token for movie search |
