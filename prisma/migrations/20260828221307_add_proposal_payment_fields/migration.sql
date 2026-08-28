-- CreateEnum
CREATE TYPE "ProposalPaymentMode" AS ENUM ('SPLIT', 'BUNDLED');

-- AlterTable
ALTER TABLE "Proposal" ADD COLUMN     "monthlyPaidAt" TIMESTAMP(3),
ADD COLUMN     "monthlyWhopPaymentId" TEXT,
ADD COLUMN     "paymentMode" "ProposalPaymentMode",
ADD COLUMN     "selectedAddOnItemIds" JSONB,
ADD COLUMN     "setupPaidAt" TIMESTAMP(3),
ADD COLUMN     "setupWhopPaymentId" TEXT,
ADD COLUMN     "whopMonthlyPlanId" TEXT,
ADD COLUMN     "whopSetupPlanId" TEXT;
