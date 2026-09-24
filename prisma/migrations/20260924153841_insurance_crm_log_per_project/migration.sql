/*
  Warnings:

  - You are about to drop the column `forwardedToMake` on the `InsuranceCrmLogEntry` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "InsuranceCrmLogEntry" DROP COLUMN "forwardedToMake",
ADD COLUMN     "forwarded" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "projectId" TEXT;

-- CreateIndex
CREATE INDEX "InsuranceCrmLogEntry_projectId_idx" ON "InsuranceCrmLogEntry"("projectId");

-- AddForeignKey
ALTER TABLE "InsuranceCrmLogEntry" ADD CONSTRAINT "InsuranceCrmLogEntry_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ServiceProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
