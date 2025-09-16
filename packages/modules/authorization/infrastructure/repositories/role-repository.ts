import { db } from '@acme/db/src/connection';
import { 
  memberships, 
  roles, 
  permissions, 
  rolePermissions, 
  user 
} from '@acme/db/src/schema';
import { eq, inArray, and } from 'drizzle-orm';
import { Role, Permission } from '../../domain/entities/role';
import { logger } from '@acme/core';

export class RoleRepository {
  async getUserRoles(userId: string, tenantId: string): Promise<Role[]> {
    try {
      logger.debug('Fetching user roles', { userId, tenantId });

      // Get user roles with their permissions
      const userRolesData = await db
        .select({
          roleId: roles.id,
          roleName: roles.name,
          roleDescription: roles.description,
          roleTenantId: roles.tenantId,
          roleCreatedAt: roles.createdAt,
          roleUpdatedAt: roles.updatedAt,
          permissionKey: permissions.key,
          permissionDescription: permissions.description,
        })
        .from(memberships)
        .innerJoin(roles, eq(memberships.roleId, roles.id))
        .innerJoin(rolePermissions, eq(roles.id, rolePermissions.roleId))
        .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
        .where(and(eq(memberships.userId, userId), eq(memberships.tenantId, tenantId)));

      // Group permissions by role
      const roleMap = new Map<string, {
        id: string;
        tenantId: string | null;
        name: string;
        description: string;
        permissions: string[];
        createdAt: Date;
        updatedAt: Date;
      }>();

      userRolesData.forEach(row => {
        const roleKey = row.roleId;
        if (!roleMap.has(roleKey)) {
          roleMap.set(roleKey, {
            id: row.roleId,
            tenantId: row.roleTenantId,
            name: row.roleName,
            description: row.roleDescription || '',
            permissions: [],
            createdAt: row.roleCreatedAt,
            updatedAt: row.roleUpdatedAt,
          });
        }
        
        const roleData = roleMap.get(roleKey)!;
        roleData.permissions.push(row.permissionKey);
      });

      // Convert to Role domain entities
      const userRoles = Array.from(roleMap.values()).map(roleData => 
        new Role(roleData)
      );

      logger.debug('User roles fetched successfully', {
        userId,
        tenantId,
        roleCount: userRoles.length,
        totalPermissions: userRoles.reduce((acc, role) => acc + role.permissions.length, 0),
      });

      return userRoles;
    } catch (error) {
      logger.error('Failed to fetch user roles', error, { userId, tenantId });
      throw error;
    }
  }

  async getPermissionsByKeys(permissionKeys: string[]): Promise<Permission[]> {
    try {
      if (permissionKeys.length === 0) return [];

      logger.debug('Fetching permissions by keys', { permissionKeys });

      const permissionsData = await db
        .select({
          key: permissions.key,
          description: permissions.description,
        })
        .from(permissions)
        .where(inArray(permissions.key, permissionKeys));

      const permissionEntities = permissionsData.map(p => 
        new Permission(p.key, p.description)
      );

      logger.debug('Permissions fetched successfully', {
        requestedCount: permissionKeys.length,
        foundCount: permissionEntities.length,
      });

      return permissionEntities;
    } catch (error) {
      logger.error('Failed to fetch permissions by keys', error, { permissionKeys });
      throw error;
    }
  }
}