/*
  Warnings:

  - The primary key for the `transactions` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropIndex
DROP INDEX "programs_ownerWallet_idx";

-- AlterTable
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_pkey",
ADD CONSTRAINT "transactions_pkey" PRIMARY KEY ("id");

-- CreateTable
CREATE TABLE "instruction_call_records" (
    "id" BIGSERIAL NOT NULL,
    "programId" TEXT NOT NULL,
    "environment" TEXT NOT NULL DEFAULT 'DEVNET',
    "instructionName" TEXT,
    "instructionDiscriminator" TEXT,
    "displayName" TEXT,
    "signature" TEXT NOT NULL,
    "slot" BIGINT NOT NULL,
    "blockTime" TIMESTAMP(3) NOT NULL,
    "success" BOOLEAN NOT NULL,
    "errorCode" TEXT,
    "errorName" TEXT,
    "errorMessage" TEXT,
    "errorCategory" TEXT,
    "computeUnitsUsed" INTEGER,
    "computeUnitsRequested" INTEGER,
    "feeLamports" BIGINT,
    "priorityFeeLamports" BIGINT,
    "callerWallet" TEXT,
    "callerType" TEXT,
    "decodedArgs" JSONB,
    "emittedEvents" JSONB,
    "cpiCount" INTEGER NOT NULL DEFAULT 0,
    "involvedPrograms" TEXT[],
    "timestamp" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "instruction_call_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "instruction_hourly_aggregates" (
    "id" BIGSERIAL NOT NULL,
    "programId" TEXT NOT NULL,
    "instructionName" TEXT NOT NULL,
    "environment" TEXT NOT NULL DEFAULT 'DEVNET',
    "bucket" TIMESTAMP(3) NOT NULL,
    "callCount" INTEGER NOT NULL DEFAULT 0,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "errorRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "successRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgComputeUnits" INTEGER,
    "p50ComputeUnits" INTEGER,
    "p95ComputeUnits" INTEGER,
    "uniqueCallers" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "instruction_hourly_aggregates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "error_explanation_cache" (
    "id" BIGSERIAL NOT NULL,
    "programId" TEXT NOT NULL,
    "instructionName" TEXT NOT NULL,
    "errorCode" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "fixSuggestion" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "error_explanation_cache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "instruction_call_records_programId_instructionName_timestam_idx" ON "instruction_call_records"("programId", "instructionName", "timestamp" DESC);

-- CreateIndex
CREATE INDEX "instruction_call_records_programId_success_timestamp_idx" ON "instruction_call_records"("programId", "success", "timestamp" DESC);

-- CreateIndex
CREATE INDEX "instruction_call_records_programId_errorCode_timestamp_idx" ON "instruction_call_records"("programId", "errorCode", "timestamp" DESC);

-- CreateIndex
CREATE INDEX "instruction_call_records_callerWallet_programId_timestamp_idx" ON "instruction_call_records"("callerWallet", "programId", "timestamp" DESC);

-- CreateIndex
CREATE INDEX "instruction_call_records_signature_idx" ON "instruction_call_records"("signature");

-- CreateIndex
CREATE INDEX "instruction_hourly_aggregates_programId_bucket_idx" ON "instruction_hourly_aggregates"("programId", "bucket" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "instruction_hourly_aggregates_programId_instructionName_env_key" ON "instruction_hourly_aggregates"("programId", "instructionName", "environment", "bucket");

-- CreateIndex
CREATE UNIQUE INDEX "error_explanation_cache_programId_instructionName_errorCode_key" ON "error_explanation_cache"("programId", "instructionName", "errorCode");

-- AddForeignKey
ALTER TABLE "instruction_call_records" ADD CONSTRAINT "instruction_call_records_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "instruction_hourly_aggregates" ADD CONSTRAINT "instruction_hourly_aggregates_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
