-- AlterTable
ALTER TABLE "ServiceProject" ADD COLUMN     "assigneeUserId" TEXT,
ADD COLUMN     "targetLaunchAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "ServiceProject_assigneeUserId_idx" ON "ServiceProject"("assigneeUserId");

-- AddForeignKey
ALTER TABLE "ServiceProject" ADD CONSTRAINT "ServiceProject_assigneeUserId_fkey" FOREIGN KEY ("assigneeUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
