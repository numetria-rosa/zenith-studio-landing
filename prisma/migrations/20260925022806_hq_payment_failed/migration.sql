-- AlterTable
ALTER TABLE "ServiceRequest" ADD COLUMN     "lastFailedPaymentId" TEXT,
ADD COLUMN     "paymentFailedAt" TIMESTAMP(3);
