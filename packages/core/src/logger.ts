import pino from 'pino';
import { env } from './env';

// Detect if we're in Next.js API runtime where pino-pretty doesn't work
const isNextJSAPIRuntime = typeof process !== 'undefined' && 
  process.env.NEXT_RUNTIME === 'nodejs' && 
  typeof window === 'undefined';

export const logger = pino({
  level: env.NODE_ENV === 'development' ? 'debug' : 'info',
  // Only use pino-pretty in development and NOT in Next.js API runtime
  transport: env.NODE_ENV === 'development' && !isNextJSAPIRuntime ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
    },
  } : undefined,
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'password',
      'token',
      'secret',
    ],
    censor: '[REDACTED]',
  },
});
