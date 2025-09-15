import { AuditLog, CreateAuditLogData } from '../domain/entities/audit-log.js';
import { AuditLogRepository } from '../infrastructure/repositories/audit-log-repository.js';
import { Result, success, failure, AppError } from '@acme/core.js';
import { logger } from '@acme/core.js';

export interface LogActionRequest extends CreateAuditLogData {
  // Extends CreateAuditLogData with any additional validation
}

export class LogActionUseCase {
  constructor(private auditLogRepository: AuditLogRepository) {}

  async execute(request: LogActionRequest): Promise<Result<AuditLog>> {
    try {
      logger.debug('Creating audit log', {
        action: request.action,
        resource: request.resource,
        tenantId: request.tenantId,
        actorUserId: request.actorUserId,
      });

      // Validate required fields
      if (!request.action) {
        return failure(AppError.badRequest('Action is required'));
      }

      if (!request.resource) {
        return failure(AppError.badRequest('Resource is required'));
      }

      // Create audit log
      const auditLog = await this.auditLogRepository.create({
        tenantId: request.tenantId,
        actorUserId: request.actorUserId,
        action: request.action,
        resource: request.resource,
        resourceId: request.resourceId,
        metadata: request.metadata || {},
        ipAddress: request.ipAddress,
        userAgent: request.userAgent,
      });

      logger.info('Audit log created', {
        auditLogId: auditLog.id,
        action: auditLog.action,
        resource: auditLog.resource,
        tenantId: auditLog.tenantId,
        actorUserId: auditLog.actorUserId,
      });

      return success(auditLog);
    } catch (error) {
      logger.error('Failed to create audit log', error, {
        action: request.action,
        resource: request.resource,
        tenantId: request.tenantId,
        actorUserId: request.actorUserId,
      });

      if (error instanceof AppError) {
        return failure(error);
      }

      return failure(
        AppError.internal('Failed to create audit log')
      );
    }
  }
}

export interface GetAuditLogsRequest {
  tenantId?: string;
  actorUserId?: string;
  action?: string;
  resource?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface GetAuditLogsResponse {
  logs: AuditLog[];
  total: number;
  hasMore: boolean;
}

export class GetAuditLogsUseCase {
  constructor(private auditLogRepository: AuditLogRepository) {}

  async execute(request: GetAuditLogsRequest): Promise<Result<GetAuditLogsResponse>> {
    try {
      logger.debug('Getting audit logs', {
        tenantId: request.tenantId,
        actorUserId: request.actorUserId,
        action: request.action,
        resource: request.resource,
        limit: request.limit,
        offset: request.offset,
      });

      const filters = {
        tenantId: request.tenantId,
        actorUserId: request.actorUserId,
        action: request.action,
        resource: request.resource,
        startDate: request.startDate,
        endDate: request.endDate,
      };

      const limit = Math.min(request.limit || 50, 1000); // Cap at 1000
      const offset = request.offset || 0;

      const [logs, total] = await Promise.all([
        this.auditLogRepository.findMany(filters, limit, offset),
        this.auditLogRepository.count(filters),
      ]);

      const hasMore = offset + limit < total;

      logger.debug('Audit logs retrieved', {
        count: logs.length,
        total,
        hasMore,
        tenantId: request.tenantId,
      });

      return success({
        logs,
        total,
        hasMore,
      });
    } catch (error) {
      logger.error('Failed to get audit logs', error, {
        tenantId: request.tenantId,
        actorUserId: request.actorUserId,
      });

      if (error instanceof AppError) {
        return failure(error);
      }

      return failure(
        AppError.internal('Failed to get audit logs')
      );
    }
  }
}
