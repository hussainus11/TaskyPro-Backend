# Database Migration Scripts

## add-payment-menu-items.ts

This script adds "Customer Payments" and "Supplier Payments" as sub-menu items under the "Payment Dashboard" menu in the database.

### Usage

```bash
cd backend
npx tsx scripts/add-payment-menu-items.ts
```

### What it does

1. Finds all "Payment Dashboard" menu items (global, company-specific, and branch-specific)
2. Adds "Customer Payments" menu item as a child of Payment Dashboard
3. Adds "Supplier Payments" menu item as a child of Payment Dashboard
4. Sets appropriate order values to place them after existing menu items
5. Handles all companies and branches automatically

### Notes

- The script is idempotent - it won't create duplicate menu items if they already exist
- Menu items are added for:
  - Global menu items (companyId = null, branchId = null)
  - Company-specific menu items (companyId set, branchId = null)
  - Branch-specific menu items (companyId and branchId set)






















