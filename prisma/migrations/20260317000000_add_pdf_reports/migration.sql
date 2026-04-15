-- CreateTable
CREATE TABLE "PdfReport" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "entityType" TEXT,
    "layout" JSONB NOT NULL,
    "pageSettings" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "companyId" INTEGER,
    "branchId" INTEGER,
    "createdById" INTEGER,
    "updatedById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PdfReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PdfReport_companyId_idx" ON "PdfReport"("companyId");

-- CreateIndex
CREATE INDEX "PdfReport_branchId_idx" ON "PdfReport"("branchId");

-- CreateIndex
CREATE INDEX "PdfReport_entityType_idx" ON "PdfReport"("entityType");

-- CreateIndex
CREATE INDEX "PdfReport_isActive_idx" ON "PdfReport"("isActive");

-- CreateIndex
CREATE INDEX "PdfReport_companyId_branchId_idx" ON "PdfReport"("companyId", "branchId");

-- AddForeignKey
ALTER TABLE "PdfReport" ADD CONSTRAINT "PdfReport_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PdfReport" ADD CONSTRAINT "PdfReport_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PdfReport" ADD CONSTRAINT "PdfReport_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PdfReport" ADD CONSTRAINT "PdfReport_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;





