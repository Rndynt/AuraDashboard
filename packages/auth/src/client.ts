import { createAuthClient } from 'better-auth/client';
// Use browser environment or fallback for client-side
const BETTER_AUTH_URL = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000';

export const authClient = createAuthClient({
  baseURL: BETTER_AUTH_URL,
});

export { type Session, type User } from './auth';
