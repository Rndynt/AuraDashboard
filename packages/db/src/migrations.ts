import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { env } from '@acme/core/src/env.js';
import { logger } from '@acme/core/src/logger.js';

export async function runMigrations() {
  logger.info('Starting database migrations...');
  
  const migrationClient = postgres(env.DATABASE_URL, { max: 1 });
  const db = drizzle(migrationClient);

  try {
    await migrate(db, { migrationsFolder: './migrations' });
    logger.info('Database migrations completed successfully');
  } catch (error) {
    logger.error('Database migration failed:', error);
    throw error;
  } finally {
    await migrationClient.end();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations().catch((error) => {
    logger.error('Migration script failed:', error);
    process.exit(1);
  });
}
