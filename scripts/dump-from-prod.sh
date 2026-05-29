#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="${ENV_FILE:-$ROOT/.env}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE — copy .env.example to .env and fill in connection details." >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

: "${PGHOST:?Set PGHOST in .env}"
: "${PGDATABASE:?Set PGDATABASE in .env}"
: "${PGUSER:?Set PGUSER in .env}"
: "${PGPASSWORD:?Set PGPASSWORD in .env}"

PGPORT="${PGPORT:-5432}"
PGSSLMODE="${PGSSLMODE:-require}"

SCHEMA_OUT="${SCHEMA_OUT:-$ROOT/backend/src/main/resources/db/migration/V1__schema.sql}"
DATA_OUT="${DATA_OUT:-$ROOT/backend/src/main/resources/db/migration/V2__seed.sql}"

TABLES=(user_group user_role app_user movie rating)

sanitize_dump() {
  sed -E \
    -e '/^\\restrict /d' \
    -e '/^\\unrestrict /d' \
    -e '/^SET /d' \
    -e '/^SELECT pg_catalog/d' \
    -e '/^-- PostgreSQL database dump/d' \
    -e '/^-- Dumped from database version/d' \
    -e '/^-- Dumped by pg_dump version/d' \
    -e 's/public\.//g'
}

run_pg_dump() {
  local extra_args=("$@")
  if command -v pg_dump >/dev/null 2>&1; then
    PGPASSWORD="$PGPASSWORD" PGSSLMODE="$PGSSLMODE" \
      pg_dump \
        -h "$PGHOST" \
        -p "$PGPORT" \
        -U "$PGUSER" \
        -d "$PGDATABASE" \
        "${extra_args[@]}"
  else
    docker run --rm \
      -e PGPASSWORD="$PGPASSWORD" \
      -e PGSSLMODE="$PGSSLMODE" \
      postgres:18-alpine \
      pg_dump \
        -h "$PGHOST" \
        -p "$PGPORT" \
        -U "$PGUSER" \
        -d "$PGDATABASE" \
        "${extra_args[@]}"
  fi
}

table_args=()
for table in "${TABLES[@]}"; do
  table_args+=(-t "$table")
done

mkdir -p "$(dirname "$SCHEMA_OUT")" "$(dirname "$DATA_OUT")"

{
  echo "-- Generated from external Postgres on $(date -u +"%Y-%m-%d %H:%M:%S UTC")"
  echo
  run_pg_dump \
    --schema-only \
    --no-owner \
    --no-privileges \
    --no-comments \
    --schema=public \
    "${table_args[@]}" | sanitize_dump
} >"$SCHEMA_OUT"

{
  echo "-- Seed from external Postgres on $(date -u +"%Y-%m-%d %H:%M:%S UTC")"
  echo
  run_pg_dump \
    --data-only \
    --no-owner \
    --column-inserts \
    --schema=public \
    "${table_args[@]}" | sanitize_dump
} >"$DATA_OUT"

echo "Wrote schema: $SCHEMA_OUT"
echo "Wrote data:   $DATA_OUT"
