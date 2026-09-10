-- CreateEnum
CREATE TYPE "LawFirmSpecialty" AS ENUM ('PERSONAL_INJURY', 'FAMILY_LAW', 'CRIMINAL_DEFENSE', 'CORPORATE', 'GENERAL');

-- AlterTable
ALTER TABLE "ServiceProject" ADD COLUMN     "specialty" "LawFirmSpecialty";

-- AlterTable
ALTER TABLE "TimeEntry" ADD COLUMN     "expenseAmountCents" INTEGER,
ALTER COLUMN "durationMinutes" DROP NOT NULL;
