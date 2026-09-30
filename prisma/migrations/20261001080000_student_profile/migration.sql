-- Student space profile fields and email notification preferences.
ALTER TABLE "User"
  ADD COLUMN "displayName" TEXT,
  ADD COLUMN "timezone" TEXT,
  ADD COLUMN "githubUrl" TEXT,
  ADD COLUMN "linkedinUrl" TEXT,
  ADD COLUMN "avatarUrl" TEXT,
  ADD COLUMN "notifyProductNews" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "notifyWeeklyRecap" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "notifyOffers" BOOLEAN NOT NULL DEFAULT false;
