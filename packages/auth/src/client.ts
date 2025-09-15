import { createAuthClient } from 'better-auth/client';

// Use browser environment or fallback for client-side
const BETTER_AUTH_URL = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000';

export const authClient = createAuthClient({
  baseURL: BETTER_AUTH_URL,
});

// Define types locally to avoid importing server-side modules
export type Session = {
  id: string;
  userId: string;
  expiresAt: Date;
  token: string;
  ipAddress?: string;
  userAgent?: string;
};

export type User = {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
  isSuperuser?: boolean;
};
