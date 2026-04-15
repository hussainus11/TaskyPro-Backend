-- Migration: Rename Dashboard menu items to be more specific
-- This migration renames "Dashboard" menu items under collapsible menus
-- to be more descriptive (e.g., "CRM Dashboard", "E-commerce Dashboard", etc.)

DO $$
DECLARE
    parent_menu_id INTEGER;
    dashboard_menu_id INTEGER;
    company_record RECORD;
    branch_record RECORD;
BEGIN
    -- ============================================
    -- 1. Rename Dashboard under CRM
    -- ============================================
    
    -- Process global menu items (companyId IS NULL AND branchId IS NULL)
    SELECT id INTO parent_menu_id
    FROM "MenuItem"
    WHERE title = 'CRM'
      AND "companyId" IS NULL
      AND "branchId" IS NULL
      AND "parentId" IS NULL
    LIMIT 1;

    IF parent_menu_id IS NOT NULL THEN
        SELECT id INTO dashboard_menu_id
        FROM "MenuItem"
        WHERE title = 'Dashboard'
          AND "parentId" = parent_menu_id
          AND "companyId" IS NULL
          AND "branchId" IS NULL
        LIMIT 1;

        IF dashboard_menu_id IS NOT NULL THEN
            UPDATE "MenuItem"
            SET title = 'CRM Dashboard', "updatedAt" = NOW()
            WHERE id = dashboard_menu_id;
        END IF;
    END IF;

    -- Process company-specific menu items
    FOR company_record IN SELECT DISTINCT "companyId" FROM "MenuItem" WHERE "companyId" IS NOT NULL
    LOOP
        SELECT id INTO parent_menu_id
        FROM "MenuItem"
        WHERE title = 'CRM'
          AND "companyId" = company_record."companyId"
          AND "branchId" IS NULL
          AND "parentId" IS NULL
        LIMIT 1;

        IF parent_menu_id IS NOT NULL THEN
            SELECT id INTO dashboard_menu_id
            FROM "MenuItem"
            WHERE title = 'Dashboard'
              AND "parentId" = parent_menu_id
              AND "companyId" = company_record."companyId"
              AND "branchId" IS NULL
            LIMIT 1;

            IF dashboard_menu_id IS NOT NULL THEN
                UPDATE "MenuItem"
                SET title = 'CRM Dashboard', "updatedAt" = NOW()
                WHERE id = dashboard_menu_id;
            END IF;
        END IF;
    END LOOP;

    -- Process branch-specific menu items
    FOR branch_record IN SELECT DISTINCT "companyId", "branchId" FROM "MenuItem" WHERE "branchId" IS NOT NULL
    LOOP
        SELECT id INTO parent_menu_id
        FROM "MenuItem"
        WHERE title = 'CRM'
          AND "companyId" = branch_record."companyId"
          AND "branchId" = branch_record."branchId"
          AND "parentId" IS NULL
        LIMIT 1;

        IF parent_menu_id IS NOT NULL THEN
            SELECT id INTO dashboard_menu_id
            FROM "MenuItem"
            WHERE title = 'Dashboard'
              AND "parentId" = parent_menu_id
              AND "companyId" = branch_record."companyId"
              AND "branchId" = branch_record."branchId"
            LIMIT 1;

            IF dashboard_menu_id IS NOT NULL THEN
                UPDATE "MenuItem"
                SET title = 'CRM Dashboard', "updatedAt" = NOW()
                WHERE id = dashboard_menu_id;
            END IF;
        END IF;
    END LOOP;

    -- ============================================
    -- 2. Rename Dashboard under E-commerce
    -- ============================================
    
    -- Process global menu items
    SELECT id INTO parent_menu_id
    FROM "MenuItem"
    WHERE title = 'E-commerce'
      AND "companyId" IS NULL
      AND "branchId" IS NULL
      AND "parentId" IS NULL
    LIMIT 1;

    IF parent_menu_id IS NOT NULL THEN
        SELECT id INTO dashboard_menu_id
        FROM "MenuItem"
        WHERE title = 'Dashboard'
          AND "parentId" = parent_menu_id
          AND "companyId" IS NULL
          AND "branchId" IS NULL
        LIMIT 1;

        IF dashboard_menu_id IS NOT NULL THEN
            UPDATE "MenuItem"
            SET title = 'E-commerce Dashboard', "updatedAt" = NOW()
            WHERE id = dashboard_menu_id;
        END IF;
    END IF;

    -- Process company-specific menu items
    FOR company_record IN SELECT DISTINCT "companyId" FROM "MenuItem" WHERE "companyId" IS NOT NULL
    LOOP
        SELECT id INTO parent_menu_id
        FROM "MenuItem"
        WHERE title = 'E-commerce'
          AND "companyId" = company_record."companyId"
          AND "branchId" IS NULL
          AND "parentId" IS NULL
        LIMIT 1;

        IF parent_menu_id IS NOT NULL THEN
            SELECT id INTO dashboard_menu_id
            FROM "MenuItem"
            WHERE title = 'Dashboard'
              AND "parentId" = parent_menu_id
              AND "companyId" = company_record."companyId"
              AND "branchId" IS NULL
            LIMIT 1;

            IF dashboard_menu_id IS NOT NULL THEN
                UPDATE "MenuItem"
                SET title = 'E-commerce Dashboard', "updatedAt" = NOW()
                WHERE id = dashboard_menu_id;
            END IF;
        END IF;
    END LOOP;

    -- Process branch-specific menu items
    FOR branch_record IN SELECT DISTINCT "companyId", "branchId" FROM "MenuItem" WHERE "branchId" IS NOT NULL
    LOOP
        SELECT id INTO parent_menu_id
        FROM "MenuItem"
        WHERE title = 'E-commerce'
          AND "companyId" = branch_record."companyId"
          AND "branchId" = branch_record."branchId"
          AND "parentId" IS NULL
        LIMIT 1;

        IF parent_menu_id IS NOT NULL THEN
            SELECT id INTO dashboard_menu_id
            FROM "MenuItem"
            WHERE title = 'Dashboard'
              AND "parentId" = parent_menu_id
              AND "companyId" = branch_record."companyId"
              AND "branchId" = branch_record."branchId"
            LIMIT 1;

            IF dashboard_menu_id IS NOT NULL THEN
                UPDATE "MenuItem"
                SET title = 'E-commerce Dashboard', "updatedAt" = NOW()
                WHERE id = dashboard_menu_id;
            END IF;
        END IF;
    END LOOP;

    -- ============================================
    -- 3. Rename Dashboard under Project Management
    -- ============================================
    
    -- Process global menu items
    SELECT id INTO parent_menu_id
    FROM "MenuItem"
    WHERE title = 'Project Management'
      AND "companyId" IS NULL
      AND "branchId" IS NULL
      AND "parentId" IS NULL
    LIMIT 1;

    IF parent_menu_id IS NOT NULL THEN
        SELECT id INTO dashboard_menu_id
        FROM "MenuItem"
        WHERE title = 'Dashboard'
          AND "parentId" = parent_menu_id
          AND "companyId" IS NULL
          AND "branchId" IS NULL
        LIMIT 1;

        IF dashboard_menu_id IS NOT NULL THEN
            UPDATE "MenuItem"
            SET title = 'Project Management Dashboard', "updatedAt" = NOW()
            WHERE id = dashboard_menu_id;
        END IF;
    END IF;

    -- Process company-specific menu items
    FOR company_record IN SELECT DISTINCT "companyId" FROM "MenuItem" WHERE "companyId" IS NOT NULL
    LOOP
        SELECT id INTO parent_menu_id
        FROM "MenuItem"
        WHERE title = 'Project Management'
          AND "companyId" = company_record."companyId"
          AND "branchId" IS NULL
          AND "parentId" IS NULL
        LIMIT 1;

        IF parent_menu_id IS NOT NULL THEN
            SELECT id INTO dashboard_menu_id
            FROM "MenuItem"
            WHERE title = 'Dashboard'
              AND "parentId" = parent_menu_id
              AND "companyId" = company_record."companyId"
              AND "branchId" IS NULL
            LIMIT 1;

            IF dashboard_menu_id IS NOT NULL THEN
                UPDATE "MenuItem"
                SET title = 'Project Management Dashboard', "updatedAt" = NOW()
                WHERE id = dashboard_menu_id;
            END IF;
        END IF;
    END LOOP;

    -- Process branch-specific menu items
    FOR branch_record IN SELECT DISTINCT "companyId", "branchId" FROM "MenuItem" WHERE "branchId" IS NOT NULL
    LOOP
        SELECT id INTO parent_menu_id
        FROM "MenuItem"
        WHERE title = 'Project Management'
          AND "companyId" = branch_record."companyId"
          AND "branchId" = branch_record."branchId"
          AND "parentId" IS NULL
        LIMIT 1;

        IF parent_menu_id IS NOT NULL THEN
            SELECT id INTO dashboard_menu_id
            FROM "MenuItem"
            WHERE title = 'Dashboard'
              AND "parentId" = parent_menu_id
              AND "companyId" = branch_record."companyId"
              AND "branchId" = branch_record."branchId"
            LIMIT 1;

            IF dashboard_menu_id IS NOT NULL THEN
                UPDATE "MenuItem"
                SET title = 'Project Management Dashboard', "updatedAt" = NOW()
                WHERE id = dashboard_menu_id;
            END IF;
        END IF;
    END LOOP;

    -- ============================================
    -- 4. Rename Dashboard under Payment Dashboard
    -- ============================================
    
    -- Process global menu items
    SELECT id INTO parent_menu_id
    FROM "MenuItem"
    WHERE title = 'Payment Dashboard'
      AND "companyId" IS NULL
      AND "branchId" IS NULL
      AND "parentId" IS NULL
    LIMIT 1;

    IF parent_menu_id IS NOT NULL THEN
        SELECT id INTO dashboard_menu_id
        FROM "MenuItem"
        WHERE title = 'Dashboard'
          AND "parentId" = parent_menu_id
          AND "companyId" IS NULL
          AND "branchId" IS NULL
        LIMIT 1;

        IF dashboard_menu_id IS NOT NULL THEN
            UPDATE "MenuItem"
            SET title = 'Payment Dashboard', "updatedAt" = NOW()
            WHERE id = dashboard_menu_id;
        END IF;
    END IF;

    -- Process company-specific menu items
    FOR company_record IN SELECT DISTINCT "companyId" FROM "MenuItem" WHERE "companyId" IS NOT NULL
    LOOP
        SELECT id INTO parent_menu_id
        FROM "MenuItem"
        WHERE title = 'Payment Dashboard'
          AND "companyId" = company_record."companyId"
          AND "branchId" IS NULL
          AND "parentId" IS NULL
        LIMIT 1;

        IF parent_menu_id IS NOT NULL THEN
            SELECT id INTO dashboard_menu_id
            FROM "MenuItem"
            WHERE title = 'Dashboard'
              AND "parentId" = parent_menu_id
              AND "companyId" = company_record."companyId"
              AND "branchId" IS NULL
            LIMIT 1;

            IF dashboard_menu_id IS NOT NULL THEN
                UPDATE "MenuItem"
                SET title = 'Payment Dashboard', "updatedAt" = NOW()
                WHERE id = dashboard_menu_id;
            END IF;
        END IF;
    END LOOP;

    -- Process branch-specific menu items
    FOR branch_record IN SELECT DISTINCT "companyId", "branchId" FROM "MenuItem" WHERE "branchId" IS NOT NULL
    LOOP
        SELECT id INTO parent_menu_id
        FROM "MenuItem"
        WHERE title = 'Payment Dashboard'
          AND "companyId" = branch_record."companyId"
          AND "branchId" = branch_record."branchId"
          AND "parentId" IS NULL
        LIMIT 1;

        IF parent_menu_id IS NOT NULL THEN
            SELECT id INTO dashboard_menu_id
            FROM "MenuItem"
            WHERE title = 'Dashboard'
              AND "parentId" = parent_menu_id
              AND "companyId" = branch_record."companyId"
              AND "branchId" = branch_record."branchId"
            LIMIT 1;

            IF dashboard_menu_id IS NOT NULL THEN
                UPDATE "MenuItem"
                SET title = 'Payment Dashboard', "updatedAt" = NOW()
                WHERE id = dashboard_menu_id;
            END IF;
        END IF;
    END LOOP;

    RAISE NOTICE 'Dashboard menu items renamed successfully!';
END $$;




















