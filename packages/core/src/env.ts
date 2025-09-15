import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().url(),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.string().url(),
  SESSION_SECRET: z.string().min(32),
  REDIS_URL: z.string().url().optional(),
  SENTRY_DSN: z.string().url().optional(),
  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().url().optional(),
  SUPERUSER_EMAIL: z.string().email(),
  SUPERUSER_NAME: z.string().min(1),
  ALLOWED_ORIGINS: z.string().transform(val => val.split(',')),
});

export const env = envSchema.parse(process.env);
export type Env = z.infer<typeof envSchema>;
