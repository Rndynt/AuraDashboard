import type { DashboardOverview } from "../entities/dashboard";

export interface DashboardRepository {
  getDashboardOverview(tenantId: string): Promise<DashboardOverview>;
}