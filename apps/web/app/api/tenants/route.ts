import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@acme/auth';
import { db } from '@acme/db/connection';
import { tenants, insertTenantSchema } from '@acme/db/schema';
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

    // For now, return all tenants - in production you'd filter by user access
    const allTenants = await db.select().from(tenants);

    return NextResponse.json(allTenants);
  } catch (error) {
    logger.error('Failed to fetch tenants:', error);
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

    // Check if user has permission to create tenants
    if (!session.user.isSuperuser) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = insertTenantSchema.parse(body);

    const [newTenant] = await db
      .insert(tenants)
      .values({
        ...validatedData,
        status: 'active',
      })
      .returning();

    logger.info('Tenant created:', { tenantId: newTenant.id, slug: newTenant.slug });

    return NextResponse.json(newTenant, { status: 201 });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    logger.error('Failed to create tenant:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
