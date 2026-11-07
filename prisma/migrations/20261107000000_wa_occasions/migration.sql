-- WhatsApp Umrah: the agency's own calendar of occasions (name + one day or a date range) that the agent reads.
CREATE TABLE "WaOccasion" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WaOccasion_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "WaOccasion_agencyId_startDate_idx" ON "WaOccasion"("agencyId", "startDate");

ALTER TABLE "WaOccasion" ADD CONSTRAINT "WaOccasion_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "WaAgency"("id") ON DELETE CASCADE ON UPDATE CASCADE;
