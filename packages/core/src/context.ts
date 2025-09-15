import { AsyncLocalStorage } from 'async_hooks';

export interface RequestContext {
  userId?: string;
  tenantId?: string;
  isSuperuser?: boolean;
  permissions?: string[];
  traceId?: string;
}

export const requestContext = new AsyncLocalStorage<RequestContext>();

export function getContext(): RequestContext {
  return requestContext.getStore() ?? {};
}

export function setContext(context: RequestContext): void {
  const current = getContext();
  requestContext.enterWith({ ...current, ...context });
}

export function withContext<T>(context: RequestContext, fn: () => T): T {
  return requestContext.run(context, fn);
}
