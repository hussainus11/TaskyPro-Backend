-- Migration: Add Customer Payments and Supplier Payments menu items
-- This migration adds Customer Payments and Supplier Payments as sub-menu items
-- under the Payment Dashboard menu item for all companies and branches

-- Function to add payment sub-menus for a specific company/branch
DO $$
DECLARE
    payment_dashboard_id INTEGER;
    max_order INTEGER;
    company_record RECORD;
    branch_record RECORD;
BEGIN
    -- Process global menu items (companyId IS NULL AND branchId IS NULL)
    SELECT id INTO payment_dashboard_id
    FROM "MenuItem"
    WHERE title = 'Payment Dashboard'
      AND "companyId" IS NULL
      AND "branchId" IS NULL
      AND "parentId" IS NULL
    LIMIT 1;

    IF payment_dashboard_id IS NOT NULL THEN
        -- Get the maximum order value for children of Payment Dashboard
        SELECT COALESCE(MAX("order"), 0) INTO max_order
        FROM "MenuItem"
        WHERE "parentId" = payment_dashboard_id
          AND "companyId" IS NULL
          AND "branchId" IS NULL;

        -- Insert Customer Payments if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM "MenuItem"
            WHERE title = 'Customer Payments'
              AND "parentId" = payment_dashboard_id
              AND "companyId" IS NULL
              AND "branchId" IS NULL
        ) THEN
            INSERT INTO "MenuItem" (title, href, icon, "parentId", "order", "isActive", "companyId", "branchId", "createdAt", "updatedAt")
            VALUES ('Customer Payments', '/dashboard/payment/customer-payments', 'User', payment_dashboard_id, max_order + 1, true, NULL, NULL, NOW(), NOW());
        END IF;

        -- Insert Supplier Payments if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM "MenuItem"
            WHERE title = 'Supplier Payments'
              AND "parentId" = payment_dashboard_id
              AND "companyId" IS NULL
              AND "branchId" IS NULL
        ) THEN
            INSERT INTO "MenuItem" (title, href, icon, "parentId", "order", "isActive", "companyId", "branchId", "createdAt", "updatedAt")
            VALUES ('Supplier Payments', '/dashboard/payment/supplier-payments', 'Users', payment_dashboard_id, max_order + 2, true, NULL, NULL, NOW(), NOW());
        END IF;
    END IF;

    -- Process company-specific menu items
    FOR company_record IN SELECT DISTINCT "companyId" FROM "MenuItem" WHERE "companyId" IS NOT NULL AND "branchId" IS NULL
    LOOP
        SELECT id INTO payment_dashboard_id
        FROM "MenuItem"
        WHERE title = 'Payment Dashboard'
          AND "companyId" = company_record."companyId"
          AND "branchId" IS NULL
          AND "parentId" IS NULL
        LIMIT 1;

        IF payment_dashboard_id IS NOT NULL THEN
            -- Get the maximum order value for children of Payment Dashboard
            SELECT COALESCE(MAX("order"), 0) INTO max_order
            FROM "MenuItem"
            WHERE "parentId" = payment_dashboard_id
              AND "companyId" = company_record."companyId"
              AND "branchId" IS NULL;

            -- Insert Customer Payments if it doesn't exist
            IF NOT EXISTS (
                SELECT 1 FROM "MenuItem"
                WHERE title = 'Customer Payments'
                  AND "parentId" = payment_dashboard_id
                  AND "companyId" = company_record."companyId"
                  AND "branchId" IS NULL
            ) THEN
                INSERT INTO "MenuItem" (title, href, icon, "parentId", "order", "isActive", "companyId", "branchId", "createdAt", "updatedAt")
                VALUES ('Customer Payments', '/dashboard/payment/customer-payments', 'User', payment_dashboard_id, max_order + 1, true, company_record."companyId", NULL, NOW(), NOW());
            END IF;

            -- Insert Supplier Payments if it doesn't exist
            IF NOT EXISTS (
                SELECT 1 FROM "MenuItem"
                WHERE title = 'Supplier Payments'
                  AND "parentId" = payment_dashboard_id
                  AND "companyId" = company_record."companyId"
                  AND "branchId" IS NULL
            ) THEN
                INSERT INTO "MenuItem" (title, href, icon, "parentId", "order", "isActive", "companyId", "branchId", "createdAt", "updatedAt")
                VALUES ('Supplier Payments', '/dashboard/payment/supplier-payments', 'Users', payment_dashboard_id, max_order + 2, true, company_record."companyId", NULL, NOW(), NOW());
            END IF;
        END IF;
    END LOOP;

    -- Process branch-specific menu items
    FOR branch_record IN SELECT DISTINCT "companyId", "branchId" FROM "MenuItem" WHERE "branchId" IS NOT NULL
    LOOP
        SELECT id INTO payment_dashboard_id
        FROM "MenuItem"
        WHERE title = 'Payment Dashboard'
          AND "companyId" = branch_record."companyId"
          AND "branchId" = branch_record."branchId"
          AND "parentId" IS NULL
        LIMIT 1;

        IF payment_dashboard_id IS NOT NULL THEN
            -- Get the maximum order value for children of Payment Dashboard
            SELECT COALESCE(MAX("order"), 0) INTO max_order
            FROM "MenuItem"
            WHERE "parentId" = payment_dashboard_id
              AND "companyId" = branch_record."companyId"
              AND "branchId" = branch_record."branchId";

            -- Insert Customer Payments if it doesn't exist
            IF NOT EXISTS (
                SELECT 1 FROM "MenuItem"
                WHERE title = 'Customer Payments'
                  AND "parentId" = payment_dashboard_id
                  AND "companyId" = branch_record."companyId"
                  AND "branchId" = branch_record."branchId"
            ) THEN
                INSERT INTO "MenuItem" (title, href, icon, "parentId", "order", "isActive", "companyId", "branchId", "createdAt", "updatedAt")
                VALUES ('Customer Payments', '/dashboard/payment/customer-payments', 'User', payment_dashboard_id, max_order + 1, true, branch_record."companyId", branch_record."branchId", NOW(), NOW());
            END IF;

            -- Insert Supplier Payments if it doesn't exist
            IF NOT EXISTS (
                SELECT 1 FROM "MenuItem"
                WHERE title = 'Supplier Payments'
                  AND "parentId" = payment_dashboard_id
                  AND "companyId" = branch_record."companyId"
                  AND "branchId" = branch_record."branchId"
            ) THEN
                INSERT INTO "MenuItem" (title, href, icon, "parentId", "order", "isActive", "companyId", "branchId", "createdAt", "updatedAt")
                VALUES ('Supplier Payments', '/dashboard/payment/supplier-payments', 'Users', payment_dashboard_id, max_order + 2, true, branch_record."companyId", branch_record."branchId", NOW(), NOW());
            END IF;
        END IF;
    END LOOP;
END $$;






















