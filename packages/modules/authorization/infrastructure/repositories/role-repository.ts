import { db } from "@acme/db/connection";
import { memberships, roles, permissions, rolePermissions } from "@acme/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import type { RoleRepository } from "../../domain/repositories/role-repository";
import { Role, Permission } from "../../domain/entities/role";

export class SqlRoleRepository implements RoleRepository {
  async getUserPermissionKeys(input: { userId: string; tenantId: string }): Promise<string[]> {
    const { userId, tenantId } = input;
    // Query to get permission keys for a user in a tenant
    const rows = await db
      .select({ key: permissions.key })
      .from(memberships)
      .innerJoin(roles, eq(roles.id, memberships.roleId))
      .innerJoin(rolePermissions, eq(rolePermissions.roleId, roles.id))
      .innerJoin(permissions, eq(permissions.id, rolePermissions.permissionId))
      .where(and(eq(memberships.userId, userId), eq(memberships.tenantId, tenantId)));

    return rows.map(r => r.key);
  }

  async getUserRoles(userId: string, tenantId: string): Promise<Role[]> {
    // Query to get all roles for a user in a tenant
    const rows = await db
      .select({
        id: roles.id,
        tenantId: roles.tenantId,
        name: roles.name,
        description: roles.description,
        createdAt: roles.createdAt,
        updatedAt: roles.updatedAt,
        permissionKey: permissions.key
      })
      .from(memberships)
      .innerJoin(roles, eq(roles.id, memberships.roleId))
      .leftJoin(rolePermissions, eq(rolePermissions.roleId, roles.id))
      .leftJoin(permissions, eq(permissions.id, rolePermissions.permissionId))
      .where(and(eq(memberships.userId, userId), eq(memberships.tenantId, tenantId)));

    // Group permissions by role
    const roleMap = new Map<string, {
      id: string;
      tenantId: string | null;
      name: string;
      description: string | null;
      createdAt: Date;
      updatedAt: Date;
      permissions: string[];
    }>();

    rows.forEach(row => {
      if (!roleMap.has(row.id)) {
        roleMap.set(row.id, {
          id: row.id,
          tenantId: row.tenantId,
          name: row.name,
          description: row.description,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
          permissions: []
        });
      }
      
      if (row.permissionKey) {
        roleMap.get(row.id)!.permissions.push(row.permissionKey);
      }
    });

    return Array.from(roleMap.values()).map(roleData => new Role(roleData));
  }

  async getPermissionsByKeys(permissionKeys: string[]): Promise<Permission[]> {
    if (permissionKeys.length === 0) {
      return [];
    }

    const rows = await db
      .select({
        key: permissions.key,
        description: permissions.description
      })
      .from(permissions)
      .where(inArray(permissions.key, permissionKeys));

    return rows.map(row => new Permission(row.key, row.description));
  }
}