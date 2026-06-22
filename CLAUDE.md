# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Telegram Mini App for a private movie club. Members add films by round, rate each other's picks, and browse stats. Spring Boot 4 backend + React/Vite frontend.

## Commands

### Backend (run from `backend/`)
```bash
./mvnw spring-boot:run          # start backend (needs Postgres or set SPRING_DATASOURCE_URL)
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
docker-compose up    # Postgres + backend (does not include dev frontend)
```

## Architecture

**Serving**: The backend serves the React SPA as static files from `src/main/resources/static/`. `npm run build` writes directly there. No separate frontend server in production.

**Auth**: No JWT or sessions. Every API request carries a `User-Id` header containing the Telegram user's numeric ID. The backend looks up the user in `app_user` — 403 if not found. Users must be manually added to the DB; this is a private app.

**Roles & groups**: Each `app_user` has a `role` (`user` or `admin`) and belongs to a `user_group`. Movies and stats are scoped to the caller's group. Only admins can delete movies they don't own.

**Frontend dev auth bypass**: Set `VITE_DEV_USER_ID` in `webapp/.env` to a known Telegram user ID to skip Telegram WebApp initialization locally. The file already has one set.

**Frontend API layer** (`webapp/src/api/`): `client.ts` wraps `fetch` — injects the `User-Id` header from either `VITE_DEV_USER_ID` or `window.Telegram.WebApp.initDataUnsafe.user.id`. All API modules call through it. Vite proxies `/api` to the backend in dev.

**Telegram bot**: Webhook at `/api/telegram/webhook` (secret-verified). Only handles `/start` — sends a Mini App launch button. Bot only activates when `telegram.bot.token` property is set (`@ConditionalOnProperty`).

**Database**: PostgreSQL in production (hosted on Render). H2 in-memory for tests. Schema is managed manually — `V1__schema.sql` is a prod dump for reference, not a migration tool. `spring.jpa.hibernate.ddl-auto=validate` will fail at startup if schema doesn't match entities.

**Deployment**: Hosted on Render (free tier). GitHub Actions workflow (`ping-render.yml`) hits the health endpoint every 5 minutes on Thursday evenings to keep the instance warm during movie club sessions.

## Key env vars

| Var | Where | Purpose |
|-----|-------|---------|
| `VITE_DEV_USER_ID` | `webapp/.env` | Local dev user ID (bypasses Telegram) |
| `TELEGRAM_BOT_TOKEN` | backend env | Required to enable the bot |
| `TELEGRAM_WEBHOOK_URL` | backend env | Must be set to public URL for webhook |
| `SPRING_DATASOURCE_URL` | backend env | Defaults to `localhost:5432/ridiculous` |
