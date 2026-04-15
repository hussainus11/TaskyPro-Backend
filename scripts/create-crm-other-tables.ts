import 'dotenv/config';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}

const pool = new Pool({ connectionString });

async function main() {
  const client = await pool.connect();
  try {
    console.log('Starting: creating StorageQuota, SystemSetting, ExceptionLog tables (if missing)...');
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS public."StorageQuota" (
        "id" SERIAL PRIMARY KEY,
        "companyId" INTEGER,
        "branchId" INTEGER,
        "totalStorage" BIGINT NOT NULL DEFAULT 10737418240,
        "usedStorage" BIGINT NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS public."SystemSetting" (
        "id" SERIAL PRIMARY KEY,
        "key" TEXT NOT NULL,
        "value" TEXT NOT NULL,
        "companyId" INTEGER,
        "branchId" INTEGER,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS public."ExceptionLog" (
        "id" SERIAL PRIMARY KEY,
        "type" TEXT NOT NULL,
        "severity" TEXT NOT NULL,
        "message" TEXT NOT NULL,
        "stack" TEXT,
        "source" TEXT NOT NULL,
        "userId" INTEGER,
        "companyId" INTEGER,
        "branchId" INTEGER,
        "requestUrl" TEXT,
        "requestMethod" TEXT,
        "userAgent" TEXT,
        "ipAddress" TEXT,
        "resolved" BOOLEAN NOT NULL DEFAULT false,
        "resolvedAt" TIMESTAMP(3),
        "resolvedBy" INTEGER,
        "notes" TEXT,
        "metadata" JSONB,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Constraints / FKs
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'StorageQuota_companyId_fkey') THEN
          ALTER TABLE public."StorageQuota"
          ADD CONSTRAINT "StorageQuota_companyId_fkey"
          FOREIGN KEY ("companyId") REFERENCES public."Company"("id") ON DELETE CASCADE;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'StorageQuota_branchId_fkey') THEN
          ALTER TABLE public."StorageQuota"
          ADD CONSTRAINT "StorageQuota_branchId_fkey"
          FOREIGN KEY ("branchId") REFERENCES public."Branch"("id") ON DELETE CASCADE;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SystemSetting_companyId_fkey') THEN
          ALTER TABLE public."SystemSetting"
          ADD CONSTRAINT "SystemSetting_companyId_fkey"
          FOREIGN KEY ("companyId") REFERENCES public."Company"("id") ON DELETE CASCADE;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SystemSetting_branchId_fkey') THEN
          ALTER TABLE public."SystemSetting"
          ADD CONSTRAINT "SystemSetting_branchId_fkey"
          FOREIGN KEY ("branchId") REFERENCES public."Branch"("id") ON DELETE CASCADE;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ExceptionLog_userId_fkey') THEN
          ALTER TABLE public."ExceptionLog"
          ADD CONSTRAINT "ExceptionLog_userId_fkey"
          FOREIGN KEY ("userId") REFERENCES public."User"("id") ON DELETE SET NULL;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ExceptionLog_companyId_fkey') THEN
          ALTER TABLE public."ExceptionLog"
          ADD CONSTRAINT "ExceptionLog_companyId_fkey"
          FOREIGN KEY ("companyId") REFERENCES public."Company"("id") ON DELETE CASCADE;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ExceptionLog_branchId_fkey') THEN
          ALTER TABLE public."ExceptionLog"
          ADD CONSTRAINT "ExceptionLog_branchId_fkey"
          FOREIGN KEY ("branchId") REFERENCES public."Branch"("id") ON DELETE CASCADE;
        END IF;
      END $$;
    `);

    // Uniques + Indexes
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "StorageQuota_companyId_branchId_key"
      ON public."StorageQuota" ("companyId","branchId");
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS "StorageQuota_companyId_idx" ON public."StorageQuota" ("companyId");`);
    await client.query(`CREATE INDEX IF NOT EXISTS "StorageQuota_branchId_idx" ON public."StorageQuota" ("branchId");`);

    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "SystemSetting_key_companyId_branchId_key"
      ON public."SystemSetting" ("key","companyId","branchId");
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS "SystemSetting_companyId_idx" ON public."SystemSetting" ("companyId");`);
    await client.query(`CREATE INDEX IF NOT EXISTS "SystemSetting_branchId_idx" ON public."SystemSetting" ("branchId");`);
    await client.query(`CREATE INDEX IF NOT EXISTS "SystemSetting_key_idx" ON public."SystemSetting" ("key");`);

    await client.query(`CREATE INDEX IF NOT EXISTS "ExceptionLog_companyId_idx" ON public."ExceptionLog" ("companyId");`);
    await client.query(`CREATE INDEX IF NOT EXISTS "ExceptionLog_branchId_idx" ON public."ExceptionLog" ("branchId");`);
    await client.query(`CREATE INDEX IF NOT EXISTS "ExceptionLog_userId_idx" ON public."ExceptionLog" ("userId");`);
    await client.query(`CREATE INDEX IF NOT EXISTS "ExceptionLog_severity_idx" ON public."ExceptionLog" ("severity");`);
    await client.query(`CREATE INDEX IF NOT EXISTS "ExceptionLog_resolved_idx" ON public."ExceptionLog" ("resolved");`);
    await client.query(`CREATE INDEX IF NOT EXISTS "ExceptionLog_source_idx" ON public."ExceptionLog" ("source");`);
    await client.query(`CREATE INDEX IF NOT EXISTS "ExceptionLog_createdAt_idx" ON public."ExceptionLog" ("createdAt");`);
    await client.query(
      `CREATE INDEX IF NOT EXISTS "ExceptionLog_companyId_branchId_idx" ON public."ExceptionLog" ("companyId","branchId");`
    );

    await client.query('COMMIT');
    console.log('✅ Done: CRM Other tables are ready.');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

main()
  .catch((err) => {
    console.error('❌ Failed to create CRM Other tables:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });



















