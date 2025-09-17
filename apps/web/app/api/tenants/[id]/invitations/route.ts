import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@acme/auth';
import { db, withTransaction } from '@acme/db/connection';
import { invitations, insertInvitationSchema } from '@acme/db/schema';
import { eq } from 'drizzle-orm';
import { requirePermission } from '@acme/rbac/guards';
import { PERMISSIONS } from '@acme/rbac/permissions';
import { AppError } from '@acme/core/errors';
import { logger } from '@acme/core/logger';
import { nanoid } from 'nanoid';

interface Context {
  params: {
    id: string;
  };
}

export async function POST(request: NextRequest, context: Context) {
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

    // Check permissions
    await requirePermission(session.user.id, tenantId, PERMISSIONS.MEMBER_INVITE);

    const validatedData = insertInvitationSchema.parse({
      ...body,
      tenantId,
      invitedBy: session.user.id,
    });

    const invitation = await withTransaction(async (tx) => {
      // Generate unique invitation token
      const token = nanoid(32);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

      const [newInvitation] = await tx
        .insert(invitations)
        .values({
          ...validatedData,
          token,
          expiresAt,
        })
        .returning();

      return newInvitation;
    }, tenantId);

    logger.info('Invitation created:', { 
      invitationId: invitation.id,
      email: invitation.email,
      tenantId,
      invitedBy: session.user.id 
    });

    // In a real app, you'd send an email here
    // await sendInvitationEmail(invitation);

    return NextResponse.json(
      { 
        id: invitation.id,
        email: invitation.email,
        token: invitation.token,
        expiresAt: invitation.expiresAt 
      }, 
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    logger.error('Failed to create invitation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
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
    await requirePermission(session.user.id, tenantId, PERMISSIONS.MEMBER_VIEW);

    const tenantInvitations = await withTransaction(async (tx) => {
      return await tx
        .select({
          id: invitations.id,
          email: invitations.email,
          expiresAt: invitations.expiresAt,
          acceptedAt: invitations.acceptedAt,
          createdAt: invitations.createdAt,
        })
        .from(invitations)
        .where(eq(invitations.tenantId, tenantId))
        .orderBy(invitations.createdAt);
    }, tenantId);

    return NextResponse.json(tenantInvitations);
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    logger.error('Failed to fetch invitations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
