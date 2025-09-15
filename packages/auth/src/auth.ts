import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '@acme/db/src/connection';
import * as schema from '@acme/db';

// Get environment variables directly
const BETTER_AUTH_SECRET = process.env.BETTER_AUTH_SECRET || 'd5f4e3c2b1a09876543210fedcba9876543210123456789abcdef0123456789';
const BETTER_AUTH_URL = process.env.BETTER_AUTH_URL || 'http://localhost:5000';
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5000'];

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema,
  }),
  
  secret: BETTER_AUTH_SECRET,
  baseURL: BETTER_AUTH_URL,
  
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60 * 24 * 7, // 7 days
    },
  },
  
  user: {
    additionalFields: {
      isSuperuser: {
        type: 'boolean',
        defaultValue: false,
      },
    },
  },
  
  rateLimit: {
    enabled: true,
    window: 60, // 1 minute
    max: 5, // 5 attempts per minute
  },
  
  trustedOrigins: ALLOWED_ORIGINS,
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.User;
