/*
  Warnings:

  - You are about to drop the column `whopMembershipId` on the `PaidAudit` table. All the data in the column will be lost.
  - You are about to drop the column `whopPaymentId` on the `PaidAudit` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "PaidAudit_whopPaymentId_key";

-- AlterTable
ALTER TABLE "PaidAudit" DROP COLUMN "whopMembershipId",
DROP COLUMN "whopPaymentId",
ADD COLUMN     "calBookingUid" TEXT,
ALTER COLUMN "status" SET DEFAULT 'BOOKED',
ALTER COLUMN "currency" SET DEFAULT 'usd';
