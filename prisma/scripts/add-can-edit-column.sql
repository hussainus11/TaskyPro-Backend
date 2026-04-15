-- Safe to run if canEdit is missing (fixes Prisma vs DB drift)
ALTER TABLE "PermissionSetting" ADD COLUMN IF NOT EXISTS "canEdit" BOOLEAN NOT NULL DEFAULT false;
UPDATE "PermissionSetting" SET "canEdit" = "canWrite" WHERE "canEdit" IS DISTINCT FROM "canWrite";
