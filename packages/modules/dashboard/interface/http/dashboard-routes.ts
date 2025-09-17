import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@acme/auth';
import { getUserPermissions } from '@acme/rbac/guards';
import { PERMISSIONS } from '@acme/rbac/permissions';
import { GetDashboardOverviewUseCase } from '../application/use-cases/get-overview';
import { DashboardRepository } from '../infrastructure/repositories/dashboard-repository';
import { AppError } from '@acme/core';
import { logger } from '@acme/core';

const dashboardRepository = new DashboardRepository();
const getDashboardOverviewUseCase = new GetDashboardOverviewUseCase(dashboardRepository);

export async function getDashboardOverview(request: NextRequest) {
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

    const result = await getDashboardOverviewUseCase.execute({
      tenantId,
      userId: session.user.id,
      userPermissions,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.message },
        { status: result.error.statusCode }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    logger.error('Dashboard overview route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
