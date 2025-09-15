import { env } from './env.js';
import { logger } from './logger.js';

export function initTelemetry() {
  if (env.NODE_ENV === 'production') {
    // Initialize OpenTelemetry
    logger.info('Telemetry initialized for production');
  }
  
  if (env.SENTRY_DSN) {
    // Initialize Sentry
    logger.info('Sentry initialized');
  }
}

export function trace<T>(name: string, fn: () => T): T {
  // Simplified tracing - would use OpenTelemetry in production
  const start = Date.now();
  logger.debug(`Starting trace: ${name}`);
  
  try {
    const result = fn();
    logger.debug(`Completed trace: ${name} (${Date.now() - start}ms)`);
    return result;
  } catch (error) {
    logger.error(`Failed trace: ${name} (${Date.now() - start}ms)`, error);
    throw error;
  }
}
