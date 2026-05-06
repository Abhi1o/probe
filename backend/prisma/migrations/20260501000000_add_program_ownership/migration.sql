-- Add ownership verification fields to programs table
ALTER TABLE "programs" ADD COLUMN "ownerWallet" TEXT;
ALTER TABLE "programs" ADD COLUMN "upgradeAuthority" TEXT;
ALTER TABLE "programs" ADD COLUMN "verificationMethod" TEXT;
ALTER TABLE "programs" ADD COLUMN "verifiedAt" TIMESTAMP(3);
ALTER TABLE "programs" ADD COLUMN "verificationDetails" TEXT;

-- Add index for owner wallet lookups
CREATE INDEX "programs_ownerWallet_idx" ON "programs"("ownerWallet");
