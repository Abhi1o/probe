#!/bin/sh
set -eu

echo "Starting Probe backend container..."

pick_database_url() {
  for candidate in \
    "${DATABASE_URL:-}" \
    "${POSTGRES_URL:-}" \
    "${DATABASE_PRIVATE_URL:-}" \
    "${POSTGRES_PRIVATE_URL:-}" \
    "${DATABASE_PUBLIC_URL:-}"
  do
    case "${candidate}" in
      ""|*localhost*|*127.0.0.1*)
        continue
        ;;
    esac

    printf '%s' "${candidate}"
    return 0
  done

  return 1
}

pick_redis_url() {
  for candidate in \
    "${REDIS_URL:-}" \
    "${REDIS_PRIVATE_URL:-}"
  do
    case "${candidate}" in
      ""|*localhost*|*127.0.0.1*)
        continue
        ;;
    esac

    printf '%s' "${candidate}"
    return 0
  done

  return 1
}

DATABASE_URL="$(pick_database_url || true)"
if [ -z "${DATABASE_URL}" ]; then
  echo "ERROR: No usable database URL found."
  echo "Set DATABASE_URL to your Railway Postgres connection string, for example \${{Postgres.DATABASE_URL}}."
  echo "Avoid localhost URLs inside Railway."
  exit 1
fi
export DATABASE_URL

REDIS_URL="$(pick_redis_url || true)"
if [ -n "${REDIS_URL}" ]; then
  export REDIS_URL
fi

echo "Database URL configured: ${DATABASE_URL%%@*}@***"
if [ -n "${REDIS_URL:-}" ]; then
  echo "Redis URL configured: ${REDIS_URL%%@*}@***"
fi
echo "Generating Prisma client..."
npx prisma generate

echo "Applying Prisma migrations..."
npx prisma migrate deploy

echo "Booting NestJS API..."
exec node dist/main
