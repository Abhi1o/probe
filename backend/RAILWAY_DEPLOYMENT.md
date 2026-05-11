# Backend Railway Deployment

This backend folder is now set up to deploy directly on Railway as its own service.

## What is included

- `Dockerfile`
  - Builds the NestJS app in a multi-stage image.
  - Generates Prisma client.
  - Prunes dev dependencies for the runtime image.
- `docker-entrypoint.sh`
  - Verifies `DATABASE_URL`.
  - Runs `prisma generate`.
  - Runs `prisma migrate deploy`.
  - Starts `node dist/main`.
- `railway.json`
  - Forces Dockerfile-based deployment.
  - Configures Railway health checks against `/api/v1/healthz`.
- `.env.example`
  - Documents required and optional runtime variables.

## Railway setup

1. Create a new Railway service from the `backend` folder.
2. Add a Railway PostgreSQL service and attach it to the backend service.
3. Add a Railway Redis service and attach it to the backend service.
4. Set these required variables on the backend service:

- `DATABASE_URL`
- `REDIS_URL` or `REDIS_HOST` + `REDIS_PORT`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`

5. Set Solana variables if you do not want the defaults:

- `SOLANA_NETWORK`
- `SOLANA_RPC_URL`
- `SOLANA_WS_URL`

## Health check

Railway will check:

- `/api/v1/healthz`

That endpoint confirms the container is up and the database is reachable.

## Notes

- The app now supports Railway-style `PORT`.
- The Redis config supports both `REDIS_URL` and host/port style variables.
- Prisma migrations run automatically at container startup.
- Optional SMTP, Slack, and Discord integrations remain env-driven.
