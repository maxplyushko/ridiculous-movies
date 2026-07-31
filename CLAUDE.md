# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Telegram Mini App for a private movie club. Members add films by round, rate each other's picks, and browse stats. Spring Boot 4 backend + React/Vite frontend.

## Development Guidelines

All new features and UI/UX changes must be fully consistent with existing patterns:
- **Components**: mirror structure, props, and state management of analogous existing components
- **Haptics**: `hapticTabTap` on every interactive tap (buttons, toggles, checkboxes); spin/reveal haptics only for spinner
- **Swipe actions**: reuse `useSwipeGesture` with same `ACTIONS_WIDTH`/`OPEN_THRESHOLD` constants; a tap anywhere outside the open row must close it — wire that with `useCloseSwipeOnOutsideTap(openSwipeId, close)`, never a page-local listener
- **CSS**: reuse existing classes (`mlp__*`, `movie-item-*`, `rating-card__*`, etc.) before adding new ones
- **Icons**: lucide-react only, consistent sizing (`size={30}` nav, `size={20}` cards, `size={16}` inline)
- **API layer**: all calls through `apiFetch` in `webapp/src/api/client.ts`; feature API modules are colocated under `features/*/api/` (e.g. `features/group/api/movies.ts`) — mirror the nearest existing one
- **Backend**: new controllers/DTOs follow `MovieController`/`MovieResponse` pattern; storage via `DataStore` with read/write lock + `persist()`
- **i18n**: all user-visible strings via `useTranslation()` hook; add keys to both `webapp/src/lib/i18n/locales/en.json` and `ru.json`
- **Motion**: every state change is animated — nothing appears, disappears, or resizes instantly. Reuse the existing keyframes/curves in `components.css` instead of inventing new ones:
  - **enter** is a CSS `animation` (runs on mount), **exit** is a CSS `transition` driven by a class — so a gesture that already moved the element with an inline `transform` (see `useSwipeBack`) wins over the exit rule and never jumps back
  - full-screen pages (`.movie-list__add__movie`, `.stat-page`, `.user-page__settings-overlay`) slide in from the right with `page-slide-in 0.3s cubic-bezier(0.25, 1, 0.5, 1)` and slide out via `transition: transform 0.3s cubic-bezier(0.4, 0, 1, 1)`
  - modals (`.confirm-dialog-overlay` / `.confirm-dialog`) fade + pop in with `dialog-overlay-in` / `dialog-pop-in`, fade + shrink out over `0.18s ease-in`
  - unmounting anything animated goes through `<Presence show={…} exitMs={…}>` (`components/Presence.tsx`) — it keeps the last children mounted for the exit and adds `presence--exiting` to its wrapper imperatively on the next frame; `PAGE_EXIT_MS` for pages, default `DIALOG_EXIT_MS` for modals
  - when the element is already in the DOM (detail stacks, stat pages), close it with `useAnimatedClose(el, closingClass, ms, onClosed)` — it toggles the class on the node directly, so the closing tap triggers **no React render** and the transition doesn't lose its first frames. `useDetailStack.pop` and `StatPage`/`PersonalStatPage` back buttons use it; swipe-back skips it (the gesture already moved the element)
  - in-place size/opacity changes use `transition … 0.28s cubic-bezier(0.4, 0, 0.2, 1)`; nav/bar transitions use `0.3s cubic-bezier(0.4, 0, 0.2, 1)`
  - animate only `transform`/`opacity` where possible; every animation needs a `@media (prefers-reduced-motion: reduce)` opt-out
  - don't flash a skeleton where a page is already open — reload silently (`load…(true)`) after closing a form, and keep a page's container element stable (swap the body, not the container) so its enter animation can't replay mid-view

## Keyboard & viewport — ASK BEFORE TOUCHING

**Never change keyboard, input-focus, or viewport logic without explicit permission — even as a side effect of an unrelated change.** This area cost weeks of regressions and is now in a known-good state. If a task seems to require touching it, stop and ask first.

In scope (do not edit unprompted):
- `hooks/useTelegramKeyboard.ts` — the only keyboard code in the repo
- `html` / `body` / `#root` / `.app-shell` / `.app-main` / `.bottom-bar` rules in `styles/global.css`
- the `<meta name="viewport">` tag in `webapp/index.html`
- `initTelegramWebApp()` in `lib/telegram/telegramTheme.ts`
- any `onFocus` / `onBlur` handler on a text input

Invariants that must hold:
- **`html, body` must never be `position: fixed` or `overflow: hidden`.** A non-scrollable document forces WKWebView to pan its internal scroll view to reveal the caret instead of scrolling, which throws content off-screen permanently. Commit `8c07c3d` added that rule incidentally in a search refactor and every "keyboard fix" commit after it (`e750dad` → `b355b7b`) was machinery fighting the resulting pan.
- **Viewport handling stays passive.** `useKeyboardOpenClass()` observes and toggles a `kb-open` class on `<html>` — nothing else. No `window.scrollTo`, no rAF correction loops, no `--kb-inset`, no `el.scrollIntoView()`.
- **Keyboard height is `innerHeight - visualViewport.height`, never minus `offsetTop`.** Telegram iOS pans the layout viewport, so `offsetTop ≈ keyboardHeight` and the terms cancel to zero.
- **Never gate keyboard detection on `isTelegramMiniApp()`** — `visualViewport` is the only signal that works in both environments.
- **The bottom bar hides in pure CSS** via `:root.kb-open .bottom-bar`, never through React state (a `MutationObserver` → `setState` round-trip lags the CSS by a frame and desyncs).
- The meta viewport keeps `maximum-scale=1.0, user-scalable=no`. Sonar flags these as an a11y violation; removing them (commit `86ce3f0`) lets iOS auto-zoom on inputs under 16px and shift the viewport on focus. Leave them.

`origin/stale-develop` is the reference for the last glitch-free state — it has zero keyboard code.

## Testing

Don't start the backend or frontend dev servers to test changes — user tests UI/UX manually. Verify via build/lint/unit tests only (`npm run build`, `npm run lint`, `mvn test`).

Don't run API validations (curl probes against a running backend) — the user performs those manually.

Use `mvn`, not `./mvnw` — the wrapper is broken in this repo (`.mvn/wrapper/maven-wrapper.properties` is missing). Whenever backend sources change, refresh the backend with `mvn` (e.g. `mvn -q test` / `mvn -q compile`).

## Commands

### Backend (run from `backend/`)
```bash
mvn spring-boot:run -Dspring-boot.run.profiles=dev   # start with local JSON storage
mvn test                     # run all tests
mvn test -Dtest=ClassName    # run single test class
mvn package -DskipTests      # build fat JAR
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

**Roles & groups**: Each user has a `role` (`user` or `admin`) and belongs to a `user_group`. Movies and stats are scoped to the caller's group. Only admins can delete movies they don't own. A user with no `groupId` gets `OnboardingModal` (`features/onboarding/`) instead of the app shell — create a group (caller becomes its admin) or join one with an invite code. Existing members share their group via `GET /api/groups/me/invite` (`useCopyInviteLink`).

**Guest accounts**: The `guest` user is capped on how much it can add. The backend rejects the write with a `GUEST_LIMIT_REACHED` error message, which the add pages and `MoviePage` catch to show `GuestLimitModal` — check for that string, don't invent a status code.

**Storage**: No SQL database. All data lives in a JSON file (`AppData`), loaded into memory at startup by `DataStoreInitializer`, held in `DataStore` with a `ReentrantReadWriteLock`. Every write rebuilds the full `AppData` object and calls `driveClient.upload()`.
- **Dev** (`@Profile("dev")`): `LocalFileStorageClient` reads/writes `scripts/data.json`
- **Prod** (`@Profile("prod")`): `GoogleDriveClient` reads/writes a Google Drive file (ID from `GOOGLE_DRIVE_FILE_ID`)

**Frontend API layer**: `webapp/src/api/client.ts` wraps `fetch` — injects `Authorization: Bearer <token>` from localStorage. Feature-scoped API modules live under `webapp/src/features/*/api/` and all call through `apiFetch`. Vite proxies `/api` to the backend in dev.

**Frontend routing**: Single-page, tab-based. `App.tsx` renders `AppShell` inside `AuthGate`. Four bottom-bar buttons, in order: Group List, Personal List, Profile, Search. Tab state lives in `App`; each page is always mounted but `hidden` when inactive. `useNavDrag` lets the nav pill be dragged between tabs and positions `.bottom-bar__indicator` imperatively.

**Shell layout**: `.app-shell` is a `100svh` flex column; `.app-main` is the single scroll container for every tab; `.bottom-bar` is `position: fixed` over it, with `.app-main` reserving `--bottom-bar-offset` of padding. The bar hides itself whenever the on-screen keyboard is up (`:root.kb-open`) or a Telegram MainButton is showing (`body.tg-main-button-open`). See **Keyboard & viewport** above before changing any of this.

**Search**: Search is one of the four bottom-bar tabs (`SearchResults`, `features/search/`), not an overlay — switching to it doesn't unmount anything, and the trailing cross only clears the query. Uses the same `ListSearchBar` as other list screens. Results cover TMDB movies/TV and TMDB people only (no club-movie or personal-watchlist result section). Recent searches are shown when the query is empty (`useRecentSearches`).

**Personal list**: Per-user private watchlist (`PersonalListPage`, `/api/personal-list`). Items carry two **independent** booleans — `inList` (in the "to watch" list) and `watched` — plus an optional `rating`. A movie can be watched without being listed, and vice-versa; a record is deleted once both flags are false and no rating remains. `inList` is nullable in storage: legacy records (no field) deserialize as `null` and are treated as `true`. Stored in `DataStore.personalMoviesById`, keyed by user ID — fully isolated from group movies. `MovieDetail` (`MoviePage.tsx`) surfaces these as a shared icon action row (rate star, group-rating badge, bookmark=`inList`, eye=`watched`) that acts on the **caller's own** record via `GET /status` + `PUT /state`, consistent across every source (group / personal / TMDB / member).

**i18n**: `react-i18next`, locales in `webapp/src/lib/i18n/locales/`. Language resolved from `AuthResponse.lang`, stored in `i18n-lang` localStorage key. Default `"en"`, fallback `"en"`.

**Telegram bot**: Webhook at `/api/telegram/webhook` (secret-verified). Only handles `/start` — sends a Mini App launch button. Bot only activates when `telegram.bot.token` property is set (`@ConditionalOnProperty`).

**TMDB**: Movie, TV and person search via TMDB API, plus movie/actor detail. Proxied through the backend to keep the API key server-side; requires `TMDB_API_KEY`. Artwork also goes through the backend (`GET /api/tmdb/image/{size}/{filename}`) rather than hitting `image.tmdb.org` directly — never build a raw TMDB image URL in the frontend. Client hooks: `useTmdbSearch`, `useTmdbPersonSearch`, `useTmdbMovieDetails`, `useTmdbActor`.

**Detail stacks**: Movie/actor detail pages are not routes — they push onto a per-page stack via `useDetailStack` (`GroupListPage`, `PersonalListPage`, `MemberListPage`, `SearchResults`), rendered by `DetailStackEntries`. The hook wires up `useSwipeBack`, `useAnimatedClose` and `useRegisterSubPage` for you; use it rather than hand-rolling detail navigation.

**Randomizer**: `RandomizerDialog` (group) and `PersonalListPage` pick a movie with a slot-machine animation — `useSpinPicker` / `useReelPicker` drive the reel, `FireworkSparks` the reveal. This is the one place spin/reveal haptics are allowed.

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
| GET | `/api/movies/by-tmdb` | Find a group movie by `tmdbId`/`title`, `204` if none |
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
| POST | `/api/groups` | Create a group; caller becomes its admin |
| POST | `/api/groups/join` | Join a group by invite code |
| GET | `/api/groups/me/invite` | Invite link + code for the caller's group |
| GET | `/api/tmdb/search` | Search TMDB for movies |
| GET | `/api/tmdb/search/person` | Search TMDB for people (actors) |
| GET | `/api/tmdb/movie/{id}` | Fetch full TMDB movie detail (poster, director, cast) |
| GET | `/api/tmdb/actor/{id}` | Fetch TMDB person detail + credits |
| GET | `/api/tmdb/image/{size}/{filename}` | Image proxy — streams TMDB artwork through the backend |
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
