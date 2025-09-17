import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@acme/auth';
import { db, withTransaction } from '@acme/db/connection';
import { auditLogs, users } from '@acme/db/schema';
import { eq, and, desc, gte, like, sql } from 'drizzle-orm';
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
    const action = searchParams.get('action');
    const resource = searchParams.get('resource');
    const actor = searchParams.get('actor');
    const days = parseInt(searchParams.get('days') || '30');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID is required' },
        { status: 400 }
      );
    }

    // Check permissions
    const userPermissions = await getUserPermissions(session.user.id, tenantId);
    if (!session.user.isSuperuser && !userPermissions.includes(PERMISSIONS.AUDIT_VIEW)) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Calculate date filter
    const dateFilter = new Date();
    dateFilter.setDate(dateFilter.getDate() - days);

    // Get audit logs within tenant context
    const result = await withTransaction(async (tx) => {
      // Build where conditions
      let whereConditions = [
        eq(auditLogs.tenantId, tenantId),
        gte(auditLogs.createdAt, dateFilter),
      ];

      if (action) {
        whereConditions.push(eq(auditLogs.action, action));
      }

      if (resource) {
        whereConditions.push(eq(auditLogs.resource, resource));
      }

      if (actor) {
        whereConditions.push(eq(auditLogs.actorUserId, actor));
      }

      // Get total count
      const [totalCount] = await tx
        .select({ count: sql<number>`count(*)` })
        .from(auditLogs)
        .where(and(...whereConditions));

      // Get audit logs
      const logs = await tx
        .select({
          id: auditLogs.id,
          action: auditLogs.action,
          resource: auditLogs.resource,
          resourceId: auditLogs.resourceId,
          metadata: auditLogs.metadata,
          ipAddress: auditLogs.ipAddress,
          userAgent: auditLogs.userAgent,
          createdAt: auditLogs.createdAt,
          actor: {
            id: users.id,
            name: users.name,
            email: users.email,
          },
        })
        .from(auditLogs)
        .leftJoin(users, eq(auditLogs.actorUserId, users.id))
        .where(and(...whereConditions))
        .orderBy(desc(auditLogs.createdAt))
        .limit(limit)
        .offset(offset);

      // Get filter options
      const actions = await tx
        .selectDistinct({ action: auditLogs.action })
        .from(auditLogs)
        .where(eq(auditLogs.tenantId, tenantId))
        .orderBy(auditLogs.action);

      const resources = await tx
        .selectDistinct({ resource: auditLogs.resource })
        .from(auditLogs)
        .where(eq(auditLogs.tenantId, tenantId))
        .orderBy(auditLogs.resource);

      return {
        logs,
        pagination: {
          total: totalCount.count,
          limit,
          offset,
          hasMore: offset + limit < totalCount.count,
        },
        filters: {
          actions: actions.map(a => a.action),
          resources: resources.map(r => r.resource),
        },
      };
    }, tenantId);

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    logger.error('Failed to fetch audit logs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { tenantId, action, resource, resourceId, metadata } = body;

    if (!tenantId || !action || !resource) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create audit log entry within tenant context
    const auditLog = await withTransaction(async (tx) => {
      const [newLog] = await tx
        .insert(auditLogs)
        .values({
          tenantId,
          actorUserId: session.user.id,
          action,
          resource,
          resourceId,
          metadata: metadata || {},
          ipAddress: request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
        })
        .returning();

      return newLog;
    }, tenantId);

    logger.info('Audit log created:', {
      id: auditLog.id,
      action,
      resource,
      tenantId,
      actorUserId: session.user.id,
    });

    return NextResponse.json(auditLog, { status: 201 });
  } catch (error) {
    logger.error('Failed to create audit log:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
