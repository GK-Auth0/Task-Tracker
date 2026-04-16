#!/bin/sh

set -eu

FLYWAY_SQL_ROOT="${FLYWAY_SQL_ROOT:-/flyway/sql}"
FLYWAY_SCHEMA_TABLE="${FLYWAY_SCHEMA_TABLE:-flyway_schema_history_schema}"
FLYWAY_SEED_TABLE="${FLYWAY_SEED_TABLE:-flyway_schema_history_seeder}"

if [ -n "${DATABASE_URL:-}" ]; then
  FLYWAY_URL="${FLYWAY_URL:-$DATABASE_URL}"
fi

if [ -z "${FLYWAY_URL:-}" ]; then
  echo "❌ FLYWAY_URL or DATABASE_URL must be set"
  exit 1
fi

COMMON_ARGS="
  -url=$FLYWAY_URL
  -baselineOnMigrate=true
  -validateOnMigrate=true
  -cleanDisabled=true
"

if [ -n "${FLYWAY_USER:-}" ]; then
  COMMON_ARGS="$COMMON_ARGS -user=$FLYWAY_USER"
fi

if [ -n "${FLYWAY_PASSWORD:-}" ]; then
  COMMON_ARGS="$COMMON_ARGS -password=$FLYWAY_PASSWORD"
fi

echo "📦 Running schema migrations from $FLYWAY_SQL_ROOT/schema"
flyway $COMMON_ARGS \
  -locations="filesystem:${FLYWAY_SQL_ROOT}/schema" \
  -table="$FLYWAY_SCHEMA_TABLE" \
  migrate

echo "🌱 Running seed migrations from $FLYWAY_SQL_ROOT/seeder"
flyway $COMMON_ARGS \
  -locations="filesystem:${FLYWAY_SQL_ROOT}/seeder" \
  -table="$FLYWAY_SEED_TABLE" \
  migrate

echo "✅ Schema and seed migrations completed successfully!"
