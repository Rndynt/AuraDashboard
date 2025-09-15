import { Role, PermissionSet } from '../domain/entities/role.js';
import { RoleRepository } from '../infrastructure/repositories/role-repository.js';
import { Result, success, failure, AppError } from '@acme/core/src/errors.js';
import { logger } from '@acme/core/src/logger.js';

export interface CheckPermissionRequest {
  userId: string;
  tenantId: string;
  permissionKey: string;
}

export interface CheckPermissionResponse {
  hasPermission: boolean;
  reason?: string;
  roleNames?: string[];
}

export class CheckPermissionUseCase {
  constructor(private roleRepository: RoleRepository) {}

  async execute(request: CheckPermissionRequest): Promise<Result<CheckPermissionResponse>> {
    try {
      logger.debug('Checking permission', {
        userId: request.userId,
        tenantId: request.tenantId,
        permissionKey: request.permissionKey,
      });

      // Get user roles for the tenant
      const userRoles = await this.roleRepository.getUserRoles(
        request.userId, 
        request.tenantId
      );

      if (userRoles.length === 0) {
        return success({
          hasPermission: false,
          reason: 'User has no roles in this tenant',
        });
      }

      // Check if any role has the required permission
      const rolesWithPermission = userRoles.filter(role => 
        role.hasPermission(request.permissionKey)
      );

      const hasPermission = rolesWithPermission.length > 0;

      logger.debug('Permission check result', {
        userId: request.userId,
        tenantId: request.tenantId,
        permissionKey: request.permissionKey,
        hasPermission,
        roleCount: userRoles.length,
        rolesWithPermission: rolesWithPermission.map(r => r.name),
      });

      return success({
        hasPermission,
        reason: hasPermission 
          ? `Permission granted through roles: ${rolesWithPermission.map(r => r.name).join(', ')}`
          : `None of user's roles (${userRoles.map(r => r.name).join(', ')}) have permission: ${request.permissionKey}`,
        roleNames: userRoles.map(r => r.name),
      });
    } catch (error) {
      logger.error('Failed to check permission', error, {
        userId: request.userId,
        tenantId: request.tenantId,
        permissionKey: request.permissionKey,
      });

      if (error instanceof AppError) {
        return failure(error);
      }

      return failure(
        AppError.internal('Permission check failed')
      );
    }
  }
}

export interface GetUserPermissionsRequest {
  userId: string;
  tenantId: string;
}

export class GetUserPermissionsUseCase {
  constructor(private roleRepository: RoleRepository) {}

  async execute(request: GetUserPermissionsRequest): Promise<Result<PermissionSet>> {
    try {
      logger.debug('Getting user permissions', {
        userId: request.userId,
        tenantId: request.tenantId,
      });

      // Get user roles for the tenant
      const userRoles = await this.roleRepository.getUserRoles(
        request.userId, 
        request.tenantId
      );

      // Collect all permissions from all roles
      const allPermissions = new Set<string>();
      userRoles.forEach(role => {
        role.permissions.forEach(permission => {
          allPermissions.add(permission);
        });
      });

      // Get permission details
      const permissions = await this.roleRepository.getPermissionsByKeys(
        Array.from(allPermissions)
      );

      logger.debug('User permissions retrieved', {
        userId: request.userId,
        tenantId: request.tenantId,
        roleCount: userRoles.length,
        permissionCount: permissions.length,
      });

      return success(new PermissionSet(permissions));
    } catch (error) {
      logger.error('Failed to get user permissions', error, {
        userId: request.userId,
        tenantId: request.tenantId,
      });

      if (error instanceof AppError) {
        return failure(error);
      }

      return failure(
        AppError.internal('Failed to get user permissions')
      );
    }
  }
}
