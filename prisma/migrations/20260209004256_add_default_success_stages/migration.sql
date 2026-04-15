-- Add default success stages for all companies and branches
-- This migration creates a default "Success Stage" for each company and branch
-- that doesn't already have a success stage

-- Insert default success stage for companies (companyId is not null, branchId is null)
INSERT INTO "LeadStage" ("name", "color", "order", "type", "companyId", "branchId", "createdAt", "updatedAt")
SELECT 
    'Success Stage',
    '#10b981',
    10,
    'success',
    c.id,
    NULL,
    NOW(),
    NOW()
FROM "Company" c
WHERE NOT EXISTS (
    SELECT 1 
    FROM "LeadStage" ls 
    WHERE ls."companyId" = c.id 
    AND ls."branchId" IS NULL 
    AND ls.type = 'success'
);

-- Insert default success stage for branches (branchId is not null)
INSERT INTO "LeadStage" ("name", "color", "order", "type", "companyId", "branchId", "createdAt", "updatedAt")
SELECT 
    'Success Stage',
    '#10b981',
    10,
    'success',
    b."companyId",
    b.id,
    NOW(),
    NOW()
FROM "Branch" b
WHERE NOT EXISTS (
    SELECT 1 
    FROM "LeadStage" ls 
    WHERE ls."branchId" = b.id 
    AND ls.type = 'success'
);

-- Insert default success stage for companies (companyId is not null, branchId is null) - Invoice Stages
INSERT INTO "InvoiceStage" ("name", "color", "order", "type", "companyId", "branchId", "createdAt", "updatedAt")
SELECT 
    'Success Stage',
    '#10b981',
    10,
    'success',
    c.id,
    NULL,
    NOW(),
    NOW()
FROM "Company" c
WHERE NOT EXISTS (
    SELECT 1 
    FROM "InvoiceStage" inv_stage 
    WHERE inv_stage."companyId" = c.id 
    AND inv_stage."branchId" IS NULL 
    AND inv_stage.type = 'success'
);

-- Insert default success stage for branches (branchId is not null) - Invoice Stages
INSERT INTO "InvoiceStage" ("name", "color", "order", "type", "companyId", "branchId", "createdAt", "updatedAt")
SELECT 
    'Success Stage',
    '#10b981',
    10,
    'success',
    b."companyId",
    b.id,
    NOW(),
    NOW()
FROM "Branch" b
WHERE NOT EXISTS (
    SELECT 1 
    FROM "InvoiceStage" inv_stage 
    WHERE inv_stage."branchId" = b.id 
    AND inv_stage.type = 'success'
);

-- Insert default success stage for companies (companyId is not null, branchId is null) - Estimate Stages
INSERT INTO "EstimateStage" ("name", "color", "order", "type", "companyId", "branchId", "createdAt", "updatedAt")
SELECT 
    'Success Stage',
    '#10b981',
    10,
    'success',
    c.id,
    NULL,
    NOW(),
    NOW()
FROM "Company" c
WHERE NOT EXISTS (
    SELECT 1 
    FROM "EstimateStage" es 
    WHERE es."companyId" = c.id 
    AND es."branchId" IS NULL 
    AND es.type = 'success'
);

-- Insert default success stage for branches (branchId is not null) - Estimate Stages
INSERT INTO "EstimateStage" ("name", "color", "order", "type", "companyId", "branchId", "createdAt", "updatedAt")
SELECT 
    'Success Stage',
    '#10b981',
    10,
    'success',
    b."companyId",
    b.id,
    NOW(),
    NOW()
FROM "Branch" b
WHERE NOT EXISTS (
    SELECT 1 
    FROM "EstimateStage" es 
    WHERE es."branchId" = b.id 
    AND es.type = 'success'
);

-- Insert default success stage for companies (companyId is not null, branchId is null) - Document Stages
INSERT INTO "DocumentStage" ("name", "color", "order", "type", "companyId", "branchId", "createdAt", "updatedAt")
SELECT 
    'Success Stage',
    '#10b981',
    10,
    'success',
    c.id,
    NULL,
    NOW(),
    NOW()
FROM "Company" c
WHERE NOT EXISTS (
    SELECT 1 
    FROM "DocumentStage" ds 
    WHERE ds."companyId" = c.id 
    AND ds."branchId" IS NULL 
    AND ds.type = 'success'
);

-- Insert default success stage for branches (branchId is not null) - Document Stages
INSERT INTO "DocumentStage" ("name", "color", "order", "type", "companyId", "branchId", "createdAt", "updatedAt")
SELECT 
    'Success Stage',
    '#10b981',
    10,
    'success',
    b."companyId",
    b.id,
    NOW(),
    NOW()
FROM "Branch" b
WHERE NOT EXISTS (
    SELECT 1 
    FROM "DocumentStage" ds 
    WHERE ds."branchId" = b.id 
    AND ds.type = 'success'
);


