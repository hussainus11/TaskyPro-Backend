-- Migration: Remove Product Detail and Order Detail menu items from E-commerce
-- This migration removes the E-commerce child menu items:
-- - "Product Detail" (href: /dashboard/pages/products/1)
-- - "Order Detail"   (href: /dashboard/pages/orders/detail)
--
-- It removes them for:
-- - Global menus (companyId IS NULL AND branchId IS NULL)
-- - Any company-specific or branch-specific copies

DO $$
BEGIN
  -- Delete Product Detail menu items (any scope)
  DELETE FROM "MenuItem"
  WHERE title = 'Product Detail'
    AND href = '/dashboard/pages/products/1';

  -- Delete Order Detail menu items (any scope)
  DELETE FROM "MenuItem"
  WHERE title = 'Order Detail'
    AND href = '/dashboard/pages/orders/detail';
END
$$;









