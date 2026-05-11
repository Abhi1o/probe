-- CreateTable
CREATE TABLE "program_health_scores" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "grade" TEXT NOT NULL,
    "trend" TEXT NOT NULL,
    "reliabilityScore" INTEGER NOT NULL,
    "performanceScore" INTEGER NOT NULL,
    "activityScore" INTEGER NOT NULL,
    "errorScore" INTEGER NOT NULL,
    "userScore" INTEGER NOT NULL,
    "successRate24h" DOUBLE PRECISION NOT NULL,
    "successRate7d" DOUBLE PRECISION NOT NULL,
    "avgComputeUnits24h" DOUBLE PRECISION NOT NULL,
    "errorRate24h" DOUBLE PRECISION NOT NULL,
    "txCount24h" INTEGER NOT NULL,
    "txCount7d" INTEGER NOT NULL,
    "uniqueUsers24h" INTEGER NOT NULL,
    "uniqueUsers7d" INTEGER NOT NULL,
    "topErrorCode" TEXT,
    "topErrorCount" INTEGER NOT NULL DEFAULT 0,
    "strengths" TEXT[],
    "warnings" TEXT[],
    "recommendations" TEXT[],
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "program_health_scores_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "program_health_scores_programId_key" ON "program_health_scores"("programId");

-- AddForeignKey
ALTER TABLE "program_health_scores" ADD CONSTRAINT "program_health_scores_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
