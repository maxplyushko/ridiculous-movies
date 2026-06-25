# CLAUDE.md

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
- **API layer**: all calls through `apiFetch` in `api/client.ts`; new modules follow pattern of `api/movies.ts`
- **Backend**: new controllers/DTOs follow `MovieController`/`MovieResponse` pattern; storage via `DataStore` with read/write lock + `persist()`

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

### Full stack
```bash
docker-compose up    # OUTDATED — still references Postgres which is no longer used
```

## Architecture

**Serving**: The backend serves the React SPA as static files from `src/main/resources/static/`. `npm run build` writes directly there. No separate frontend server in production.

**Auth**: No JWT or sessions. Every API request carries a `User-Id` header containing the Telegram user's numeric ID. The backend looks up the user in the in-memory `DataStore` — 403 if not found. Users must be in the JSON data file; this is a private app.

**Roles & groups**: Each user has a `role` (`user` or `admin`) and belongs to a `user_group`. Movies and stats are scoped to the caller's group. Only admins can delete movies they don't own.

**Storage**: No SQL database. All data lives in a JSON file (`AppData`), loaded into memory at startup by `DataStoreInitializer`, held in `DataStore` with a `ReentrantReadWriteLock`. Every write persists the whole JSON back to storage.
- **Dev** (`@Profile("dev")`): `LocalFileStorageClient` reads/writes `scripts/ridiculous-movies-db.json`
- **Prod** (`@Profile("prod")`): `GoogleDriveClient` reads/writes a Google Drive file (ID from `GOOGLE_DRIVE_FILE_ID`)

**Frontend dev auth bypass**: Set `VITE_DEV_USER_ID` in `webapp/.env` to a known user ID to skip Telegram WebApp initialization locally. The file already has one set.

**Frontend API layer** (`webapp/src/api/`): `client.ts` wraps `fetch` — injects the `User-Id` header from either `VITE_DEV_USER_ID` or `window.Telegram.WebApp.initDataUnsafe.user.id`. All API modules call through it. Vite proxies `/api` to the backend in dev.

**Telegram bot**: Webhook at `/api/telegram/webhook` (secret-verified). Only handles `/start` — sends a Mini App launch button. Bot only activates when `telegram.bot.token` property is set (`@ConditionalOnProperty`).

**TMDB**: Movie search via TMDB API (`GET /api/tmdb/search?query=`). Proxied through backend to keep the API key server-side. Requires `TMDB_API_KEY` env var.

**Ratings**: Submitted as part of create/update movie — `CreateMovieRequest` and `UpdateMovieRequest` both accept a `ratings` list. No separate ratings endpoint.

**Deployment**: Hosted on Render (free tier). GitHub Actions workflow (`ping-render.yml`) hits the health endpoint every 5 minutes on Thursday evenings to keep the instance warm during movie club sessions.

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/start` | Health/startup check |
| GET | `/api/auth` | Verify user identity, return user info |
| GET | `/api/movies` | List movies (params: `filter`, `sort`, `minRatings`, `requireAllUsers`) |
| GET | `/api/movies/groups` | List movies grouped by round |
| POST | `/api/movies` | Create movie (with optional ratings) |
| PUT | `/api/movies/{id}` | Update movie (with optional ratings) |
| DELETE | `/api/movies/{id}` | Delete movie (admin or owner) |
| GET | `/api/stats` | Group stats |
| GET | `/api/users` | List users in caller's group |
| PUT | `/api/users/me/preferences` | Update caller's host preferences |
| GET | `/api/tmdb/search` | Search TMDB for movies |
| POST | `/api/telegram/webhook` | Telegram bot webhook |

## Key env vars

| Var | Where | Purpose |
|-----|-------|---------|
| `VITE_DEV_USER_ID` | `webapp/.env` | Local dev user ID (bypasses Telegram) |
| `TELEGRAM_BOT_TOKEN` | backend env | Required to enable the bot |
| `TELEGRAM_WEBHOOK_URL` | backend env | Must be set to public URL for webhook |
| `GOOGLE_DRIVE_FILE_ID` | backend env | Google Drive file used as prod database |
| `TMDB_API_KEY` | backend env | TMDB Bearer token for movie search |
