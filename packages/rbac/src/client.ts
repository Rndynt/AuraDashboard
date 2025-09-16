// Client-safe RBAC exports (browser-compatible, no server dependencies)
export { PERMISSIONS, DEFAULT_ROLES, ROLE_PERMISSIONS } from './permissions';
export type { PermissionKey } from './permissions';
export type { AuthorizedUser, TenantContext } from './types';