-- Add Pro value to Plan enum
ALTER TYPE "Plan" ADD VALUE IF NOT EXISTS 'Pro';

-- CreateEnum
DO $$ BEGIN
 CREATE TYPE "SubscriptionStatus" AS ENUM ('Active', 'Inactive', 'Cancelled', 'Expired', 'Pending');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- CreateEnum
DO $$ BEGIN
 CREATE TYPE "BillingCycle" AS ENUM ('Monthly', 'Yearly');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Add columns to Company table (without default first)
ALTER TABLE "Company" 
ADD COLUMN IF NOT EXISTS "plan" "Plan",
ADD COLUMN IF NOT EXISTS "subscriptionStatus" "SubscriptionStatus",
ADD COLUMN IF NOT EXISTS "subscriptionStartDate" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "subscriptionEndDate" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "billingCycle" "BillingCycle";

-- Update existing rows to have default values (using string cast to avoid enum commit issue)
UPDATE "Company" SET "plan" = 'Free'::"Plan" WHERE "plan" IS NULL;
UPDATE "Company" SET "subscriptionStatus" = 'Active'::"SubscriptionStatus" WHERE "subscriptionStatus" IS NULL;

-- Set NOT NULL constraints and defaults
ALTER TABLE "Company" 
ALTER COLUMN "plan" SET NOT NULL,
ALTER COLUMN "plan" SET DEFAULT 'Free'::"Plan",
ALTER COLUMN "subscriptionStatus" SET NOT NULL,
ALTER COLUMN "subscriptionStatus" SET DEFAULT 'Active'::"SubscriptionStatus",
ALTER COLUMN "billingCycle" SET DEFAULT 'Monthly'::"BillingCycle";



























































