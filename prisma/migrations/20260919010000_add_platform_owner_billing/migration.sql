-- AlterTable
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "isPlatformOwner" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE IF NOT EXISTS "CompanyBillingTransaction" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "plan" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyBillingTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CompanyBillingTransaction_companyId_idx" ON "CompanyBillingTransaction"("companyId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CompanyBillingTransaction_status_idx" ON "CompanyBillingTransaction"("status");

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "CompanyBillingTransaction" ADD CONSTRAINT "CompanyBillingTransaction_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;
