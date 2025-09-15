import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@acme/auth/src/auth.js';
import { db, withTransaction } from '@acme/db/src/connection.js';
import { memberships, users, roles, tenants } from '@acme/db/src/schema.js';
import { eq, and } from 'drizzle-orm';
import { getUserPermissions, requirePermission } from '@acme/rbac/src/guards.js';
import { PERMISSIONS } from '@acme/rbac/src/permissions.js';
import { AppError } from '@acme/core/src/errors.js';
import { logger } from '@acme/core/src/logger.js';

interface Context {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, context: Context) {
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

    const tenantId = context.params.id;

    // Check permissions
    const userPermissions = await getUserPermissions(session.user.id, tenantId);
    if (!session.user.isSuperuser && !userPermissions.includes(PERMISSIONS.MEMBER_VIEW)) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Get members within tenant context
    const members = await withTransaction(async (tx) => {
      return await tx
        .select({
          id: memberships.id,
          status: memberships.status,
          joinedAt: memberships.createdAt,
          user: {
            id: users.id,
            name: users.name,
            email: users.email,
            status: users.status,
          },
          role: {
            id: roles.id,
            name: roles.name,
          },
        })
        .from(memberships)
        .innerJoin(users, eq(memberships.userId, users.id))
        .innerJoin(roles, eq(memberships.roleId, roles.id))
        .where(eq(memberships.tenantId, tenantId))
        .orderBy(memberships.createdAt);
    }, tenantId);

    return NextResponse.json(members);
  } catch (error) {
    logger.error('Failed to fetch members:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, context: Context) {
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

    const tenantId = context.params.id;
    const body = await request.json();
    const { membershipId, roleId, status } = body;

    // Check permissions
    await requirePermission(session.user.id, tenantId, PERMISSIONS.MEMBER_MANAGE);

    const updatedMembership = await withTransaction(async (tx) => {
      const [membership] = await tx
        .update(memberships)
        .set({
          ...(roleId && { roleId }),
          ...(status && { status }),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(memberships.id, membershipId),
            eq(memberships.tenantId, tenantId)
          )
        )
        .returning();

      if (!membership) {
        throw AppError.notFound('Membership not found');
      }

      return membership;
    }, tenantId);

    logger.info('Membership updated:', { 
      membershipId, 
      tenantId, 
      updatedBy: session.user.id 
    });

    return NextResponse.json(updatedMembership);
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    logger.error('Failed to update membership:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
