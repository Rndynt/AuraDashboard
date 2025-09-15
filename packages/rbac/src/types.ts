export interface AuthorizedUser {
  id: string;
  email: string;
  name: string;
  isSuperuser: boolean;
  tenantId?: string;
  permissions: string[];
}

export interface TenantContext {
  tenantId: string;
  userId: string;
  permissions: string[];
  isSuperuser: boolean;
}
