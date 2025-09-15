// Only export schema types and select functions - avoid server-only imports
export * from './schema';

// Note: db, migrations, seeds are server-only and should be imported directly in API routes
// Use: import { db } from '@acme/db/connection' in server code only
