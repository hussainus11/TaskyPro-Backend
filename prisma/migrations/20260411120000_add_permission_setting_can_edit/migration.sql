-- AlterTable
ALTER TABLE "PermissionSetting" ADD COLUMN "canEdit" BOOLEAN NOT NULL DEFAULT false;

-- Existing rows: historically canWrite implied both add and edit
UPDATE "PermissionSetting" SET "canEdit" = "canWrite" WHERE "canWrite" = true;
