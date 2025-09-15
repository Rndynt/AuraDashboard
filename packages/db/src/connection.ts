import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '@acme/core';
import * as schema from './schema';

const client = postgres(env.DATABASE_URL, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(client, { schema });

export async function withTransaction<T>(
  fn: (tx: typeof db) => Promise<T>,
  tenantId?: string
): Promise<T> {
  return await db.transaction(async (tx) => {
    if (tenantId) {
      await tx.execute(sql`SET LOCAL app.tenant_id = ${tenantId}`);
    }
    return await fn(tx);
  });
}

export { sql } from 'drizzle-orm';
