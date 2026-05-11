-- CreateTable
CREATE TABLE "cpi_edges" (
    "id" TEXT NOT NULL,
    "callerProgramId" TEXT NOT NULL,
    "callerLabel" TEXT NOT NULL DEFAULT 'Unknown',
    "calleeProgramId" TEXT NOT NULL,
    "calleeLabel" TEXT NOT NULL DEFAULT 'Unknown',
    "invocationCount" INTEGER NOT NULL DEFAULT 0,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "avgComputeUnits" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "maxDepth" INTEGER NOT NULL DEFAULT 1,
    "lastInvoked" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cpi_edges_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cpi_edges_callerProgramId_idx" ON "cpi_edges"("callerProgramId");

-- CreateIndex
CREATE INDEX "cpi_edges_calleeProgramId_idx" ON "cpi_edges"("calleeProgramId");

-- CreateIndex
CREATE UNIQUE INDEX "cpi_edges_callerProgramId_calleeProgramId_key" ON "cpi_edges"("callerProgramId", "calleeProgramId");
