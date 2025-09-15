export interface DashboardStats {
  totalMembers: number;
  activeSessions: number;
  apiRequests: number;
  securityScore: number;
}

export interface ActivityItem {
  id: string;
  type: 'user.invite' | 'role.update' | 'apikey.create' | 'session.revoke';
  actorName: string;
  targetName?: string;
  description: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface OnboardingStep {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  required: boolean;
}

export interface DashboardOverview {
  stats: DashboardStats;
  recentActivity: ActivityItem[];
  onboardingProgress: {
    completed: number;
    total: number;
    steps: OnboardingStep[];
  };
  quickActions: {
    id: string;
    title: string;
    description: string;
    icon: string;
    permission?: string;
    action: string;
  }[];
}

export class Dashboard {
  constructor(
    public readonly tenantId: string,
    public readonly overview: DashboardOverview
  ) {}

  public getCompletionPercentage(): number {
    const { completed, total } = this.overview.onboardingProgress;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  }

  public getNextOnboardingStep(): OnboardingStep | null {
    return this.overview.onboardingProgress.steps.find(step => !step.completed) || null;
  }

  public isOnboardingComplete(): boolean {
    return this.overview.onboardingProgress.completed === this.overview.onboardingProgress.total;
  }
}
