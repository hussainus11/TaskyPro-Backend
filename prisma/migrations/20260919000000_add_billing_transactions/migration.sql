-- AlterTable
ALTER TABLE "UserSettings" ADD COLUMN IF NOT EXISTS "billingTransactions" JSONB;
