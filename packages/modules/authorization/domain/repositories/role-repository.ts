import type { PermissionSet, Role, Permission } from "../entities/role";

export interface RoleRepository {
  // Fetch all permission keys granted to a user under a tenant.
  getUserPermissionKeys(input: { userId: string; tenantId: string }): Promise<string[]>;

  // Optional: return a richer set if your use case needs it.
  getUserPermissionSet?(input: { userId: string; tenantId: string }): Promise<PermissionSet>;

  // Get all roles assigned to a user within a tenant
  getUserRoles(userId: string, tenantId: string): Promise<Role[]>;

  // Get permission details by their keys
  getPermissionsByKeys(permissionKeys: string[]): Promise<Permission[]>;
}