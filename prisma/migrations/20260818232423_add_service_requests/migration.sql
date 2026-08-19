-- CreateTable
CREATE TABLE "ServiceRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'new',
    "monthlyStatus" TEXT NOT NULL DEFAULT 'inactive',
    "whopSetupPaymentId" TEXT,
    "whopSetupMembershipId" TEXT,
    "whopMonthlyMembershipId" TEXT,
    "adminNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ServiceRequest_whopMonthlyMembershipId_idx" ON "ServiceRequest"("whopMonthlyMembershipId");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceRequest_userId_serviceId_key" ON "ServiceRequest"("userId", "serviceId");

-- AddForeignKey
ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
