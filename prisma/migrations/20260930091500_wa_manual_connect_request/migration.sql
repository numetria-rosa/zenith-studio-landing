CREATE TYPE "WaManualConnectRequestStatus" AS ENUM ('PENDING', 'RESOLVED');

CREATE TABLE "WaManualConnectRequest" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "contactPhone" TEXT NOT NULL,
    "wabaId" TEXT,
    "phoneNumberId" TEXT,
    "notes" TEXT,
    "status" "WaManualConnectRequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "WaManualConnectRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "WaManualConnectRequest_agencyId_idx" ON "WaManualConnectRequest"("agencyId");
CREATE INDEX "WaManualConnectRequest_status_idx" ON "WaManualConnectRequest"("status");

ALTER TABLE "WaManualConnectRequest" ADD CONSTRAINT "WaManualConnectRequest_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "WaAgency"("id") ON DELETE CASCADE ON UPDATE CASCADE;
