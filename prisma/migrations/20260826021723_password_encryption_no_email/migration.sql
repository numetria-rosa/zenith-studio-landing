/*
  Warnings:

  - You are about to drop the column `tempPassword` on the `PurchaseClaim` table. All the data in the column will be lost.
  - You are about to drop the column `passwordHash` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "PurchaseClaim" DROP COLUMN "tempPassword";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "passwordHash",
ADD COLUMN     "passwordEnc" TEXT;
