#!/bin/sh
set -eu

echo "Starting Probe backend container..."

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL is required."
  exit 1
fi

echo "Generating Prisma client..."
npx prisma generate

echo "Applying Prisma migrations..."
npx prisma migrate deploy

echo "Booting NestJS API..."
exec node dist/main
