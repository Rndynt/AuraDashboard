import { Dashboard, DashboardOverview } from "../../domain/entities/dashboard";
import type { DashboardRepository } from "../../domain/repositories/dashboard-repository";
import { Result, success, failure, AppError } from "@acme/core";
import { logger } from "@acme/core";

export interface GetDashboardOverviewRequest {
  tenantId: string;
  userId: string;
  userPermissions: string[];
}

export class GetDashboardOverviewUseCase {
  constructor(private dashboardRepository: DashboardRepository) {}

  async execute(request: GetDashboardOverviewRequest): Promise<Result<Dashboard>> {
    try {
      logger.debug('Getting dashboard overview', { 
        tenantId: request.tenantId, 
        userId: request.userId 
      });

      // Get dashboard data
      const overview = await this.dashboardRepository.getDashboardOverview(
        request.tenantId
      );

      // Filter quick actions based on user permissions
      const filteredQuickActions = overview.quickActions.filter(action => {
        if (!action.permission) return true;
        return request.userPermissions.includes(action.permission);
      });

      const filteredOverview: DashboardOverview = {
        ...overview,
        quickActions: filteredQuickActions,
      };

      const dashboard = new Dashboard(request.tenantId, filteredOverview);

      logger.debug('Dashboard overview retrieved successfully', {
        tenantId: request.tenantId,
        statsCount: Object.keys(overview.stats).length,
        activityCount: overview.recentActivity.length,
        completionPercentage: dashboard.getCompletionPercentage(),
      });

      return success(dashboard);
    } catch (error) {
      logger.error('Failed to get dashboard overview', error, {
        tenantId: request.tenantId,
        userId: request.userId,
      });

      if (error instanceof AppError) {
        return failure(error);
      }

      return failure(
        AppError.internal('Failed to retrieve dashboard overview')
      );
    }
  }
}
