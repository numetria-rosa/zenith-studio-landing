-- CreateTable
CREATE TABLE "AdminSetting" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "bookingLink" TEXT,
    "notifySetupDue" BOOLEAN NOT NULL DEFAULT true,
    "notifyTrialEnding" BOOLEAN NOT NULL DEFAULT true,
    "notifyNewRequest" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "AdminSetting_pkey" PRIMARY KEY ("id")
);
