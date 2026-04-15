import { prisma } from "../lib/prisma";

/**
 * Maps form field types to PostgreSQL column types
 */
function getColumnType(field: any): string {
  const type = field.type?.toLowerCase() || "text";
  
  switch (type) {
    case "number":
    case "integer":
      return "INTEGER";
    case "decimal":
    case "float":
      return "DECIMAL(10, 2)";
    case "date":
      return "DATE";
    case "datetime":
    case "timestamp":
      return "TIMESTAMP";
    case "time":
      return "TIME";
    case "boolean":
    case "checkbox":
    case "toggle":
      return "BOOLEAN";
    case "textarea":
    case "richtext":
      return "TEXT";
    case "json":
      return "JSONB";
    default:
      return "VARCHAR(255)";
  }
}

/**
 * Sanitizes a string to be used as a database identifier
 */
function sanitizeIdentifier(name: string): string {
  // Convert to lowercase, replace spaces and special chars with underscores
  return name
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/^[0-9]/, "_$&") // Can't start with number
    .replace(/_{2,}/g, "_") // Replace multiple underscores with one
    .replace(/^_|_$/g, ""); // Remove leading/trailing underscores
}

/**
 * Creates a database table for a custom entity based on form fields
 */
export async function createCustomEntityTable(
  entityName: string,
  formFields: any[],
  companyId?: number | null,
  branchId?: number | null
): Promise<string> {
  if (!entityName || !formFields || formFields.length === 0) {
    throw new Error("Entity name and form fields are required");
  }

  // Sanitize entity name for table name
  const tableName = `custom_${sanitizeIdentifier(entityName)}`;
  
  // Check if table already exists
  const tableExists = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = ${tableName}
  `;

  if (tableExists.length > 0) {
    throw new Error(`Table ${tableName} already exists`);
  }

  // Build column definitions
  const columns: string[] = [
    "id SERIAL PRIMARY KEY",
    `company_id ${companyId ? "INTEGER" : "INTEGER NULL"}`,
    `branch_id ${branchId ? "INTEGER" : "INTEGER NULL"}`,
    "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
    "updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
  ];

  // Add columns for each form field
  for (const field of formFields) {
    if (!field.name) continue;
    
    const columnName = sanitizeIdentifier(field.name);
    const columnType = getColumnType(field);
    const nullable = field.required ? "NOT NULL" : "NULL";
    
    columns.push(`${columnName} ${columnType} ${nullable}`);
  }

  // Create the table
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS "${tableName}" (
      ${columns.join(",\n      ")}
    )
  `;

  await prisma.$executeRawUnsafe(createTableSQL);

  // Create indexes
  if (companyId) {
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_${tableName}_company_id ON "${tableName}"(company_id)
    `);
  }
  if (branchId) {
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_${tableName}_branch_id ON "${tableName}"(branch_id)
    `);
  }

  // Create updated_at trigger
  await prisma.$executeRawUnsafe(`
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = CURRENT_TIMESTAMP;
      RETURN NEW;
    END;
    $$ language 'plpgsql';
    
    CREATE TRIGGER update_${tableName}_updated_at 
    BEFORE UPDATE ON "${tableName}"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  `);

  return tableName;
}

/**
 * Gets the table name for a custom entity
 */
export function getCustomEntityTableName(entityName: string): string {
  return `custom_${sanitizeIdentifier(entityName)}`;
}

