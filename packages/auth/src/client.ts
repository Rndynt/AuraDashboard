import { createAuthClient } from 'better-auth/client';
import { env } from '@acme/core/src/env';

export const authClient = createAuthClient({
  baseURL: typeof window !== 'undefined' ? window.location.origin : env.BETTER_AUTH_URL,
});

export { type Session, type User } from './auth';
