import { db, withTransaction } from '@acme/db/src/connection';
import { 
  memberships, 
  auditLogs, 
  apiKeys, 
  sessions, 
  users 
} from '@acme/db/src/schema';
import { eq, count, desc, gte, sql, and } from 'drizzle-orm';
import { DashboardOverview, ActivityItem } from '../domain/entities/dashboard';
import { logger } from '@acme/core';

export class DashboardRepository {
  async getDashboardOverview(tenantId: string): Promise<DashboardOverview> {
    return await withTransaction(async (tx) => {
      // Get member count
      const [memberCount] = await tx
        .select({ count: count() })
        .from(memberships)
        .where(eq(memberships.tenantId, tenantId));

      // Get active sessions count (from last 24 hours)
      const last24Hours = new Date();
      last24Hours.setDate(last24Hours.getDate() - 1);
      
      const [activeSessionsCount] = await tx
        .select({ count: count() })
        .from(sessions)
        .innerJoin(memberships, eq(sessions.userId, memberships.userId))
        .where(
          and(
            eq(memberships.tenantId, tenantId),
            gte(sessions.expiresAt, new Date())
          )
        );

      // Get API keys count
      const [apiKeysCount] = await tx
        .select({ count: count() })
        .from(apiKeys)
        .where(eq(apiKeys.tenantId, tenantId));

      // Get recent audit logs
      const recentLogs = await tx
        .select({
          id: auditLogs.id,
          action: auditLogs.action,
          resource: auditLogs.resource,
          metadata: auditLogs.metadata,
          createdAt: auditLogs.createdAt,
          actorName: users.name,
        })
        .from(auditLogs)
        .leftJoin(users, eq(auditLogs.actorUserId, users.id))
        .where(eq(auditLogs.tenantId, tenantId))
        .orderBy(desc(auditLogs.createdAt))
        .limit(10);

      // Calculate activity metrics for the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const [activityMetrics] = await tx
        .select({
          totalEvents: sql<number>`count(*)`,
        })
        .from(auditLogs)
        .where(
          and(
            eq(auditLogs.tenantId, tenantId),
            gte(auditLogs.createdAt, thirtyDaysAgo)
          )
        );

      // Transform audit logs to activity items
      const recentActivity: ActivityItem[] = recentLogs.map(log => ({
        id: log.id,
        type: log.action as any,
        actorName: log.actorName || 'System',
        description: this.formatActivityDescription(log.action, log.resource, log.metadata),
        timestamp: log.createdAt,
        metadata: log.metadata as Record<string, any>,
      }));

      // Calculate onboarding progress
      const onboardingSteps = [
        { id: 'tenant', title: 'Create tenant account', completed: true, required: true },
        { id: 'auth', title: 'Set up authentication', completed: true, required: true },
        { id: 'roles', title: 'Configure roles & permissions', completed: true, required: true },
        { id: 'members', title: 'Invite team members', completed: memberCount.count > 1, required: false },
        { id: 'apikeys', title: 'Set up API keys', completed: apiKeysCount.count > 0, required: false },
        { id: 'audit', title: 'Configure audit logging', completed: true, required: true },
      ];

      const completedSteps = onboardingSteps.filter(step => step.completed).length;

      return {
        stats: {
          totalMembers: memberCount.count,
          activeSessions: activeSessionsCount.count,
          apiRequests: activityMetrics?.totalEvents || 0,
          securityScore: 98, // This would be calculated based on security policies
        },
        recentActivity,
        onboardingProgress: {
          completed: completedSteps,
          total: onboardingSteps.length,
          steps: onboardingSteps,
        },
        quickActions: [
          {
            id: 'invite-member',
            title: 'Invite Member',
            description: 'Add a new team member',
            icon: 'user-plus',
            permission: 'member.invite',
            action: 'openInviteDialog',
          },
          {
            id: 'create-api-key',
            title: 'Create API Key',
            description: 'Generate new API access',
            icon: 'key',
            permission: 'apikey.create',
            action: 'createApiKey',
          },
          {
            id: 'manage-roles',
            title: 'Manage Roles',
            description: 'Configure permissions',
            icon: 'shield',
            permission: 'role.manage',
            action: 'manageRoles',
          },
          {
            id: 'view-audit-logs',
            title: 'View Audit Logs',
            description: 'Monitor system activity',
            icon: 'file-text',
            permission: 'audit.view',
            action: 'viewAuditLogs',
          },
        ],
      };
    }, tenantId);
  }

  private formatActivityDescription(action: string, resource: string, metadata: any): string {
    const meta = metadata || {};
    
    switch (action) {
      case 'user.invite':
        return `invited ${meta.email || 'a user'} to the team`;
      case 'role.update':
        return `updated role permissions for ${meta.roleName || 'a role'}`;
      case 'apikey.create':
        return `generated a new API key for ${meta.name || 'API access'}`;
      case 'session.revoke':
        return `revoked session for ${meta.deviceName || 'a device'}`;
      default:
        return `performed ${action} on ${resource}`;
    }
  }
}
