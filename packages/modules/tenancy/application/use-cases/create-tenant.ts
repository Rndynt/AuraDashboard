import { Tenant } from '../domain/entities/tenant.js';
import { TenantRepository } from '../infrastructure/repositories/tenant-repository.js';
import { Result, success, failure, AppError } from '@acme/core/src/errors.js';
import { logger } from '@acme/core/src/logger.js';

export interface CreateTenantRequest {
  name: string;
  slug: string;
  description?: string;
  createdBy: string;
}

export class CreateTenantUseCase {
  constructor(private tenantRepository: TenantRepository) {}

  async execute(request: CreateTenantRequest): Promise<Result<Tenant>> {
    try {
      logger.debug('Creating tenant', { 
        name: request.name, 
        slug: request.slug,
        createdBy: request.createdBy
      });

      // Validate inputs
      if (!request.name.trim()) {
        return failure(AppError.badRequest('Tenant name is required'));
      }

      if (!request.slug.trim()) {
        return failure(AppError.badRequest('Tenant slug is required'));
      }

      // Validate slug format
      if (!/^[a-z0-9-]+$/.test(request.slug)) {
        return failure(AppError.badRequest('Tenant slug must contain only lowercase letters, numbers, and hyphens'));
      }

      // Check if slug is already taken
      const existingTenant = await this.tenantRepository.findBySlug(request.slug);
      if (existingTenant) {
        return failure(AppError.conflict('Tenant slug is already taken'));
      }

      // Create tenant
      const tenant = await this.tenantRepository.create({
        name: request.name.trim(),
        slug: request.slug.trim(),
        description: request.description?.trim(),
        status: 'active',
      });

      logger.info('Tenant created successfully', {
        tenantId: tenant.id,
        slug: tenant.slug,
        name: tenant.name,
        createdBy: request.createdBy,
      });

      return success(tenant);
    } catch (error) {
      logger.error('Failed to create tenant', error, {
        name: request.name,
        slug: request.slug,
        createdBy: request.createdBy,
      });

      if (error instanceof AppError) {
        return failure(error);
      }

      return failure(
        AppError.internal('Failed to create tenant')
      );
    }
  }
}
