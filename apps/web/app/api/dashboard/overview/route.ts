import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@acme/auth';
import { db, withTransaction } from '@acme/db/connection';
import { memberships, auditLogs, apiKeys, sessions } from '@acme/db/schema';
import { eq, count, desc, gte, sql } from 'drizzle-orm';
import { getUserPermissions } from '@acme/rbac/guards';
import { PERMISSIONS } from '@acme/rbac/permissions';
import { AppError } from '@acme/core/errors';
import { logger } from '@acme/core/logger';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID is required' },
        { status: 400 }
      );
    }

    // Check permissions
    const userPermissions = await getUserPermissions(session.user.id, tenantId);
    if (!session.user.isSuperuser && !userPermissions.includes(PERMISSIONS.DASHBOARD_VIEW)) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Get dashboard overview data within tenant context
    const overview = await withTransaction(async (tx) => {
      // Get member count
      const [memberCount] = await tx
        .select({ count: count() })
        .from(memberships)
        .where(eq(memberships.tenantId, tenantId));

      // Get active sessions count
      const [activeSessionsCount] = await tx
        .select({ count: count() })
        .from(sessions)
        .where(gte(sessions.expiresAt, new Date()));

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
          createdAt: auditLogs.createdAt,
        })
        .from(auditLogs)
        .where(eq(auditLogs.tenantId, tenantId))
        .orderBy(desc(auditLogs.createdAt))
        .limit(5);

      // Calculate activity metrics for the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const [activityMetrics] = await tx
        .select({
          totalEvents: sql<number>`count(*)`,
          uniqueActors: sql<number>`count(distinct actor_user_id)`,
        })
        .from(auditLogs)
        .where(
          eq(auditLogs.tenantId, tenantId) && 
          gte(auditLogs.createdAt, thirtyDaysAgo)
        );

      return {
        stats: {
          totalMembers: memberCount.count,
          activeSessions: activeSessionsCount.count,
          apiKeys: apiKeysCount.count,
          totalEvents: activityMetrics?.totalEvents || 0,
          uniqueActors: activityMetrics?.uniqueActors || 0,
        },
        recentActivity: recentLogs,
        onboardingProgress: {
          completed: 3,
          total: 6,
          steps: [
            { id: 'tenant', title: 'Create tenant account', completed: true },
            { id: 'auth', title: 'Set up authentication', completed: true },
            { id: 'roles', title: 'Configure roles & permissions', completed: true },
            { id: 'members', title: 'Invite team members', completed: false },
            { id: 'apikeys', title: 'Set up API keys', completed: false },
            { id: 'audit', title: 'Configure audit logging', completed: false },
          ],
        },
      };
    }, tenantId);

    return NextResponse.json(overview);
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    logger.error('Failed to fetch dashboard overview:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
