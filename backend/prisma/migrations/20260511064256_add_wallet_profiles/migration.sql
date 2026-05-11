-- CreateTable
CREATE TABLE "wallet_profiles" (
    "address" TEXT NOT NULL,
    "primaryLabel" TEXT NOT NULL DEFAULT 'retail',
    "isBot" BOOLEAN NOT NULL DEFAULT false,
    "isWhale" BOOLEAN NOT NULL DEFAULT false,
    "isSmartMoney" BOOLEAN NOT NULL DEFAULT false,
    "isFresh" BOOLEAN NOT NULL DEFAULT false,
    "isDormant" BOOLEAN NOT NULL DEFAULT false,
    "totalTxCount" INTEGER NOT NULL DEFAULT 0,
    "successRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgTxPerDay" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "firstSeenAt" TIMESTAMP(3),
    "lastSeenAt" TIMESTAMP(3),
    "programStats" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wallet_profiles_pkey" PRIMARY KEY ("address")
);
