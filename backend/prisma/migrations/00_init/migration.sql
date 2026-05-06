-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN', 'DEVELOPER');
CREATE TYPE "Network" AS ENUM ('MAINNET_BETA', 'DEVNET', 'TESTNET');
CREATE TYPE "TxStatus" AS ENUM ('SUCCESS', 'FAILED', 'PENDING');
CREATE TYPE "AlertCondition" AS ENUM ('TRANSACTION_FAILURE_RATE', 'COMPUTE_UNITS_EXCEEDED', 'TRANSACTION_COUNT_THRESHOLD', 'CUSTOM_METRIC');
CREATE TYPE "Comparison" AS ENUM ('GREATER_THAN', 'LESS_THAN', 'EQUAL_TO');
CREATE TYPE "Channel" AS ENUM ('EMAIL', 'SLACK', 'DISCORD', 'WEBHOOK');
CREATE TYPE "NotificationType" AS ENUM ('ALERT', 'INFO', 'WARNING', 'ERROR');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "programs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "network" "Network" NOT NULL,
    "repositoryUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" BIGSERIAL NOT NULL,
    "programId" TEXT NOT NULL,
    "signature" TEXT NOT NULL,
    "slot" BIGINT NOT NULL,
    "blockTime" TIMESTAMP(3) NOT NULL,
    "blockDateUtc" DATE NOT NULL,
    "status" "TxStatus" NOT NULL,
    "fee" BIGINT NOT NULL,
    "computeUnits" INTEGER,
    "signer" TEXT NOT NULL,
    "instructions" JSONB,
    "logs" TEXT[],
    "error" TEXT,
    "rawData" JSONB,
    "indexedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "transactions_pkey" PRIMARY KEY ("blockTime", "id")
);

-- Convert transactions to TimescaleDB hypertable (run manually after migration if TimescaleDB is available)
-- SELECT create_hypertable('transactions', 'blockTime', chunk_time_interval => INTERVAL '1 day', if_not_exists => TRUE);

-- CreateTable
CREATE TABLE "metrics" (
    "id" BIGSERIAL NOT NULL,
    "programId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "hour" TIMESTAMPTZ NOT NULL,
    "txCount" INTEGER NOT NULL DEFAULT 0,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "avgComputeUnits" DOUBLE PRECISION,
    "avgFee" DOUBLE PRECISION,
    "medianComputeUnits" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alerts" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "condition" "AlertCondition" NOT NULL,
    "threshold" DOUBLE PRECISION NOT NULL,
    "comparison" "Comparison" NOT NULL,
    "channels" "Channel"[],
    "cooldown" INTEGER NOT NULL DEFAULT 300,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alert_triggers" (
    "id" TEXT NOT NULL,
    "alertId" TEXT NOT NULL,
    "triggeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "value" DOUBLE PRECISION NOT NULL,
    "notified" BOOLEAN NOT NULL DEFAULT false,
    "notifiedAt" TIMESTAMP(3),
    CONSTRAINT "alert_triggers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_keys" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "lastUsed" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" BIGSERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "details" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "programs_programId_key" ON "programs"("programId");
CREATE INDEX "programs_userId_idx" ON "programs"("userId");
CREATE INDEX "programs_programId_idx" ON "programs"("programId");
CREATE INDEX "programs_network_idx" ON "programs"("network");

-- Note: Removed unique constraint on signature for TimescaleDB compatibility
CREATE INDEX "transactions_signature_idx" ON "transactions"("signature");
CREATE INDEX "transactions_programId_blockTime_idx" ON "transactions"("programId", "blockTime" DESC);
CREATE INDEX "transactions_signer_blockTime_idx" ON "transactions"("signer", "blockTime" DESC);
CREATE INDEX "transactions_status_idx" ON "transactions"("status");
CREATE INDEX "transactions_blockDateUtc_idx" ON "transactions"("blockDateUtc");

CREATE INDEX "metrics_programId_hour_idx" ON "metrics"("programId", "hour" DESC);
CREATE INDEX "alerts_programId_idx" ON "alerts"("programId");
CREATE INDEX "alerts_enabled_idx" ON "alerts"("enabled");
CREATE INDEX "alert_triggers_alertId_triggeredAt_idx" ON "alert_triggers"("alertId", "triggeredAt" DESC);

CREATE UNIQUE INDEX "api_keys_key_key" ON "api_keys"("key");
CREATE INDEX "api_keys_userId_idx" ON "api_keys"("userId");
CREATE INDEX "audit_logs_userId_createdAt_idx" ON "audit_logs"("userId", "createdAt" DESC);
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");
CREATE INDEX "notifications_userId_createdAt_idx" ON "notifications"("userId", "createdAt" DESC);
CREATE INDEX "notifications_read_idx" ON "notifications"("read");

-- AddForeignKey
ALTER TABLE "programs" ADD CONSTRAINT "programs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "metrics" ADD CONSTRAINT "metrics_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "alert_triggers" ADD CONSTRAINT "alert_triggers_alertId_fkey" FOREIGN KEY ("alertId") REFERENCES "alerts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
