import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '@acme/db/src/connection';
import { env } from '@acme/core/src/env';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
  }),
  
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  
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
  
  trustedOrigins: env.ALLOWED_ORIGINS,
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.User;
