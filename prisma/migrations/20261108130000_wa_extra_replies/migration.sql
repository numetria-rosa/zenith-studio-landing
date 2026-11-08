-- Extra AI replies bought for one month (one row per Whop payment).
CREATE TABLE "WaExtraReplies" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "replies" INTEGER NOT NULL,
    "budgetUsdCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "whopPaymentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WaExtraReplies_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WaExtraReplies_whopPaymentId_key" ON "WaExtraReplies"("whopPaymentId");
CREATE INDEX "WaExtraReplies_agencyId_periodStart_idx" ON "WaExtraReplies"("agencyId", "periodStart");

ALTER TABLE "WaExtraReplies" ADD CONSTRAINT "WaExtraReplies_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "WaAgency"("id") ON DELETE CASCADE ON UPDATE CASCADE;
