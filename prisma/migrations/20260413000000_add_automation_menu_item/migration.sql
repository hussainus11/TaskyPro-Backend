-- Add global "Automation" menu item (Apps group)
-- This is data, not schema; safe to run repeatedly.

INSERT INTO "MenuItem" (
  "title",
  "href",
  "icon",
  "group",
  "parentId",
  "order",
  "isActive",
  "isComing",
  "isNew",
  "isDataBadge",
  "newTab",
  "companyId",
  "branchId",
  "createdAt",
  "updatedAt"
)
SELECT
  'Automation' AS "title",
  '/dashboard/pages/business-processes' AS "href",
  'Workflow' AS "icon",
  'Apps' AS "group",
  NULL AS "parentId",
  0 AS "order",
  true AS "isActive",
  false AS "isComing",
  false AS "isNew",
  NULL AS "isDataBadge",
  false AS "newTab",
  NULL AS "companyId",
  NULL AS "branchId",
  NOW() AS "createdAt",
  NOW() AS "updatedAt"
WHERE NOT EXISTS (
  SELECT 1
  FROM "MenuItem"
  WHERE "href" = '/dashboard/pages/business-processes'
    AND "group" = 'Apps'
    AND "companyId" IS NULL
    AND "branchId" IS NULL
);

