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
    console.log('Starting: creating LoginHistory table (if missing)...');
    await client.query('BEGIN');

    // Create table (matches Prisma model name exactly: "LoginHistory")
    await client.query(`
      CREATE TABLE IF NOT EXISTS public."LoginHistory" (
        "id" SERIAL PRIMARY KEY,
        "userId" INTEGER NOT NULL,
        "companyId" INTEGER,
        "branchId" INTEGER,
        "ipAddress" TEXT,
        "latitude" DOUBLE PRECISION,
        "longitude" DOUBLE PRECISION,
        "city" TEXT,
        "region" TEXT,
        "country" TEXT,
        "timezone" TEXT,
        "userAgent" TEXT,
        "device" TEXT,
        "browser" TEXT,
        "os" TEXT,
        "loginAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Foreign keys (idempotent via pg_constraint checks)
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'LoginHistory_userId_fkey'
        ) THEN
          ALTER TABLE public."LoginHistory"
          ADD CONSTRAINT "LoginHistory_userId_fkey"
          FOREIGN KEY ("userId") REFERENCES public."User"("id") ON DELETE CASCADE;
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'LoginHistory_companyId_fkey'
        ) THEN
          ALTER TABLE public."LoginHistory"
          ADD CONSTRAINT "LoginHistory_companyId_fkey"
          FOREIGN KEY ("companyId") REFERENCES public."Company"("id") ON DELETE CASCADE;
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'LoginHistory_branchId_fkey'
        ) THEN
          ALTER TABLE public."LoginHistory"
          ADD CONSTRAINT "LoginHistory_branchId_fkey"
          FOREIGN KEY ("branchId") REFERENCES public."Branch"("id") ON DELETE CASCADE;
        END IF;
      END $$;
    `);

    // Indexes (idempotent)
    await client.query(`CREATE INDEX IF NOT EXISTS "LoginHistory_userId_idx" ON public."LoginHistory" ("userId");`);
    await client.query(`CREATE INDEX IF NOT EXISTS "LoginHistory_companyId_idx" ON public."LoginHistory" ("companyId");`);
    await client.query(`CREATE INDEX IF NOT EXISTS "LoginHistory_branchId_idx" ON public."LoginHistory" ("branchId");`);
    await client.query(`CREATE INDEX IF NOT EXISTS "LoginHistory_loginAt_idx" ON public."LoginHistory" ("loginAt");`);
    await client.query(
      `CREATE INDEX IF NOT EXISTS "LoginHistory_companyId_branchId_idx" ON public."LoginHistory" ("companyId","branchId");`
    );
    await client.query(`CREATE INDEX IF NOT EXISTS "LoginHistory_userId_loginAt_idx" ON public."LoginHistory" ("userId","loginAt");`);

    await client.query('COMMIT');
    console.log('✅ Done: LoginHistory table is ready.');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

main()
  .catch((err) => {
    console.error('❌ Failed to create LoginHistory table:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });




















