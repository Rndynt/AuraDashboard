import { db } from '@acme/db/connection';
import { memberships, roles, rolePermissions, permissions } from '@acme/db';
import { eq, and } from 'drizzle-orm';
import { getContext, AppError } from '@acme/core';
import type { PermissionKey } from './permissions';

export async function checkPermission(
  userId: string,
  tenantId: string,
  permissionKey: PermissionKey
): Promise<boolean> {
  const context = getContext();
  
  // Superusers have all permissions
  if (context.isSuperuser) {
    return true;
  }

  const result = await db
    .select({ permissionKey: permissions.key })
    .from(memberships)
    .innerJoin(roles, eq(memberships.roleId, roles.id))
    .innerJoin(rolePermissions, eq(roles.id, rolePermissions.roleId))
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(
      and(
        eq(memberships.userId, userId),
        eq(memberships.tenantId, tenantId),
        eq(memberships.status, 'active'),
        eq(permissions.key, permissionKey)
      )
    );

  return result.length > 0;
}

export async function requirePermission(
  userId: string,
  tenantId: string,
  permissionKey: PermissionKey
): Promise<void> {
  const hasPermission = await checkPermission(userId, tenantId, permissionKey);
  
  if (!hasPermission) {
    throw AppError.forbidden(`Missing permission: ${permissionKey}`);
  }
}

export async function getUserPermissions(
  userId: string,
  tenantId: string
): Promise<string[]> {
  const context = getContext();
  
  // Superusers have all permissions
  if (context.isSuperuser) {
    const allPermissions = await db.select({ key: permissions.key }).from(permissions);
    return allPermissions.map(p => p.key);
  }

  const result = await db
    .select({ permissionKey: permissions.key })
    .from(memberships)
    .innerJoin(roles, eq(memberships.roleId, roles.id))
    .innerJoin(rolePermissions, eq(roles.id, rolePermissions.roleId))
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(
      and(
        eq(memberships.userId, userId),
        eq(memberships.tenantId, tenantId),
        eq(memberships.status, 'active')
      )
    );

  return result.map(r => r.permissionKey);
}
