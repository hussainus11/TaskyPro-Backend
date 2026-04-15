-- CreateTable
CREATE TABLE "ChatAccess" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "targetUserId" INTEGER NOT NULL,
    "companyId" INTEGER,
    "branchId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatAccess_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChatAccess_userId_idx" ON "ChatAccess"("userId");

-- CreateIndex
CREATE INDEX "ChatAccess_targetUserId_idx" ON "ChatAccess"("targetUserId");

-- CreateIndex
CREATE INDEX "ChatAccess_companyId_idx" ON "ChatAccess"("companyId");

-- CreateIndex
CREATE INDEX "ChatAccess_branchId_idx" ON "ChatAccess"("branchId");

-- CreateIndex
CREATE INDEX "ChatAccess_companyId_branchId_idx" ON "ChatAccess"("companyId", "branchId");

-- CreateUniqueIndex
CREATE UNIQUE INDEX "ChatAccess_userId_targetUserId_companyId_branchId_key" ON "ChatAccess"("userId", "targetUserId", "companyId", "branchId");

-- AddForeignKey
ALTER TABLE "ChatAccess" ADD CONSTRAINT "ChatAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatAccess" ADD CONSTRAINT "ChatAccess_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatAccess" ADD CONSTRAINT "ChatAccess_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatAccess" ADD CONSTRAINT "ChatAccess_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;




























