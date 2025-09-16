import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../../db/src/connection";
import * as schema from "../../db/src/schema";
import { randomUUID } from "crypto";

// Get environment variables with fallback like demo
const BETTER_AUTH_SECRET = process.env.BETTER_AUTH_SECRET || "";
const BETTER_AUTH_URL = process.env.BETTER_AUTH_URL || "http://localhost:5000";
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(",") || [
  "http://localhost:5000",
  "https://d2f220f3-f80f-4f87-b534-79a1ab15e084-00-3v6xcsvh5reix.worf.replit.dev",
];

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),

  secret: BETTER_AUTH_SECRET,
  baseURL: BETTER_AUTH_URL,

  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    // No requireEmailVerification means email verification is completely disabled
  },

  // CRITICAL: Disable Better Auth's ID generation - let database handle UUIDs
  advanced: {
    database: {
      generateId: false,
    },
  },

  session: {
    modelName: "session",
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60 * 24 * 7, // 7 days
    },
  },

  user: {
    modelName: "user",
    additionalFields: {
      isSuperuser: {
        type: "boolean",
        defaultValue: false,
      },
    },
  },

  account: {
    modelName: "account",
  },

  verification: {
    modelName: "verification",
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
export type User = AuthUser;
