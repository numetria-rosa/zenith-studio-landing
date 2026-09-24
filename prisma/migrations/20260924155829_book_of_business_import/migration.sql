-- AlterTable
ALTER TABLE "InsurancePolicy" ADD COLUMN     "projectId" TEXT;

-- CreateIndex
CREATE INDEX "InsurancePolicy_projectId_idx" ON "InsurancePolicy"("projectId");

-- AddForeignKey
ALTER TABLE "InsurancePolicy" ADD CONSTRAINT "InsurancePolicy_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ServiceProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
