import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../../db/src/connection";
import * as schema from "../../db/src/schema";

// Get environment variables directly
const BETTER_AUTH_SECRET =
  process.env.BETTER_AUTH_SECRET ||
  "6c9f8e7a5b4d3c2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e";
const BETTER_AUTH_URL = process.env.BETTER_AUTH_URL || "http://localhost:5000";
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(",") || [
  "http://localhost:5000",
  "https://23215867-5b23-46d9-8169-919c4f040f73-00-2204r30y6j2vz.picard.replit.dev",
];

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),

  secret: BETTER_AUTH_SECRET,
  baseURL: BETTER_AUTH_URL,

  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },

  session: {
    modelName: "sessions",
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60 * 24 * 7, // 7 days
    },
  },

  user: {
    modelName: "users",
    additionalFields: {
      isSuperuser: {
        type: "boolean",
        defaultValue: false,
      },
    },
  },

  account: {
    modelName: "accounts",
  },

  verification: {
    modelName: "verifications",
  },

  rateLimit: {
    enabled: true,
    window: 60, // 1 minute
    max: 5, // 5 attempts per minute
  },

  trustedOrigins: ALLOWED_ORIGINS,
});

export type Session = typeof auth.$Infer.Session;
export type AuthUser = typeof auth.$Infer.Session.user;
