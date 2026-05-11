-- CreateTable
CREATE TABLE "mev_events" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "mevType" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "victimSignature" TEXT,
    "attackerSignature" TEXT,
    "relatedSignatures" TEXT[],
    "attackerWallet" TEXT,
    "victimWallet" TEXT,
    "estimatedLostLamports" BIGINT NOT NULL DEFAULT 0,
    "estimatedProfitLamports" BIGINT NOT NULL DEFAULT 0,
    "slot" BIGINT,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT,

    CONSTRAINT "mev_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "mev_events_programId_detectedAt_idx" ON "mev_events"("programId", "detectedAt" DESC);

-- CreateIndex
CREATE INDEX "mev_events_attackerWallet_idx" ON "mev_events"("attackerWallet");

-- CreateIndex
CREATE INDEX "mev_events_mevType_idx" ON "mev_events"("mevType");
