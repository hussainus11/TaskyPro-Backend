-- CreateTable
CREATE TABLE "FormSectionPermission" (
    "id" SERIAL NOT NULL,
    "sectionId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "companyId" INTEGER,
    "branchId" INTEGER,
    "canView" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FormSectionPermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormFieldPermission" (
    "id" SERIAL NOT NULL,
    "fieldId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "companyId" INTEGER,
    "branchId" INTEGER,
    "canView" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FormFieldPermission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FormSectionPermission_sectionId_idx" ON "FormSectionPermission"("sectionId");

-- CreateIndex
CREATE INDEX "FormSectionPermission_userId_idx" ON "FormSectionPermission"("userId");

-- CreateIndex
CREATE INDEX "FormSectionPermission_companyId_idx" ON "FormSectionPermission"("companyId");

-- CreateIndex
CREATE INDEX "FormSectionPermission_branchId_idx" ON "FormSectionPermission"("branchId");

-- CreateIndex
CREATE UNIQUE INDEX "FormSectionPermission_sectionId_userId_companyId_branchId_key" ON "FormSectionPermission"("sectionId", "userId", "companyId", "branchId");

-- CreateIndex
CREATE INDEX "FormFieldPermission_fieldId_idx" ON "FormFieldPermission"("fieldId");

-- CreateIndex
CREATE INDEX "FormFieldPermission_userId_idx" ON "FormFieldPermission"("userId");

-- CreateIndex
CREATE INDEX "FormFieldPermission_companyId_idx" ON "FormFieldPermission"("companyId");

-- CreateIndex
CREATE INDEX "FormFieldPermission_branchId_idx" ON "FormFieldPermission"("branchId");

-- CreateIndex
CREATE UNIQUE INDEX "FormFieldPermission_fieldId_userId_companyId_branchId_key" ON "FormFieldPermission"("fieldId", "userId", "companyId", "branchId");

-- AddForeignKey
ALTER TABLE "FormSectionPermission" ADD CONSTRAINT "FormSectionPermission_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "FormSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormSectionPermission" ADD CONSTRAINT "FormSectionPermission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormSectionPermission" ADD CONSTRAINT "FormSectionPermission_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormSectionPermission" ADD CONSTRAINT "FormSectionPermission_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormFieldPermission" ADD CONSTRAINT "FormFieldPermission_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "FormField"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormFieldPermission" ADD CONSTRAINT "FormFieldPermission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormFieldPermission" ADD CONSTRAINT "FormFieldPermission_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormFieldPermission" ADD CONSTRAINT "FormFieldPermission_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create default permissions for all existing users, sections, and fields
-- This gives all users in a company/branch access to all sections and fields by default
DO $$
DECLARE
    user_record RECORD;
    section_record RECORD;
    field_record RECORD;
BEGIN
    -- Loop through all users
    FOR user_record IN SELECT id, "companyId", "branchId" FROM "User" WHERE "companyId" IS NOT NULL
    LOOP
        -- Create section permissions for all sections in the user's company
        FOR section_record IN 
            SELECT id FROM "FormSection" 
            WHERE "companyId" = user_record."companyId"
        LOOP
            -- Insert section permission if it doesn't exist
            INSERT INTO "FormSectionPermission" ("sectionId", "userId", "companyId", "branchId", "canView")
            VALUES (section_record.id, user_record.id, user_record."companyId", user_record."branchId", true)
            ON CONFLICT ("sectionId", "userId", "companyId", "branchId") DO NOTHING;
        END LOOP;

        -- Create field permissions for all fields in sections the user has access to
        FOR field_record IN 
            SELECT f.id, f."sectionId" 
            FROM "FormField" f
            INNER JOIN "FormSection" s ON f."sectionId" = s.id
            WHERE s."companyId" = user_record."companyId"
        LOOP
            -- Insert field permission if it doesn't exist
            INSERT INTO "FormFieldPermission" ("fieldId", "userId", "companyId", "branchId", "canView")
            VALUES (field_record.id, user_record.id, user_record."companyId", user_record."branchId", true)
            ON CONFLICT ("fieldId", "userId", "companyId", "branchId") DO NOTHING;
        END LOOP;
    END LOOP;
END $$;










































