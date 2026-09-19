import "dotenv/config";
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;

// idleTimeoutMillis: 0 — release connections immediately when idle so the pool
// never holds stale connections across Neon's auto-suspend cycles.
// connectionTimeoutMillis: 30000 — give Neon up to 30 s to cold-start its
// compute before we give up on a new connection attempt.
const pool = new Pool({
  connectionString,
  max: 5,
  idleTimeoutMillis: 0,
  connectionTimeoutMillis: 30000,
});

pool.on('error', (err) => {
  // Log but don't crash the process — pg will create a fresh connection next time.
  console.error('[pg pool] unexpected client error:', err.message);
});

const adapter = new PrismaPg(pool);
const _prisma = new PrismaClient({ adapter });

// Retry wrapper for transient Neon connectivity errors (P1001 / P1002).
// Uses exponential back-off: 500 ms → 1 s → 2 s.
async function withRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err: any) {
      lastErr = err;
      if ((err?.code === 'P1001' || err?.code === 'P1002') && i < retries - 1) {
        const delay = 500 * Math.pow(2, i);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
}

// Proxy that transparently wraps every Prisma model call with withRetry.
export const prisma = new Proxy(_prisma, {
  get(target, prop) {
    const value = (target as any)[prop];
    if (typeof value !== 'object' || value === null) return value;

    // Wrap each method on model delegates (findMany, create, update, etc.)
    return new Proxy(value, {
      get(modelTarget, method) {
        const fn = (modelTarget as any)[method];
        if (typeof fn !== 'function') return fn;
        return (...args: any[]) => withRetry(() => fn.apply(modelTarget, args));
      },
    });
  },
}) as typeof _prisma;
