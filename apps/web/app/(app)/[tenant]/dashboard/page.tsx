import { auth } from '@acme/auth/src/auth.js';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { db, withTransaction } from '@acme/db/src/connection.js';
import { tenants, auditLogs, memberships } from '@acme/db/src/schema.js';
import { eq, count, desc } from 'drizzle-orm';
import { Sidebar } from '@acme/ui/src/components/sidebar.js';
import { Header } from '@acme/ui/src/components/header.js';
import { 
  Users, 
  Activity, 
  Zap, 
  ShieldCheck, 
  UserPlus, 
  Key, 
  Shield, 
  FileText,
  Check 
} from 'lucide-react';

interface DashboardPageProps {
  params: {
    tenant: string;
  };
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect('/auth');
  }

  // Get tenant data
  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.slug, params.tenant))
    .limit(1);

  if (!tenant) {
    redirect('/dashboard');
  }

  // Get dashboard data within tenant context
  const dashboardData = await withTransaction(async (tx) => {
    // Get member count
    const [memberCountResult] = await tx
      .select({ count: count() })
      .from(memberships)
      .where(eq(memberships.tenantId, tenant.id));

    // Get recent audit logs
    const recentLogs = await tx
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.tenantId, tenant.id))
      .orderBy(desc(auditLogs.createdAt))
      .limit(5);

    return {
      memberCount: memberCountResult.count,
      recentLogs,
    };
  }, tenant.id);

  const user = {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    isSuperuser: session.user.isSuperuser || false,
    permissions: [], // TODO: Load user permissions
  };

  const breadcrumbs = [
    { label: 'Dashboard' },
    { label: 'Overview' },
  ];

  return (
    <div className="flex h-screen bg-background">
      <Sidebar 
        user={user}
        tenant={{
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
        }}
        memberCount={dashboardData.memberCount}
      />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <Header 
          user={user}
          breadcrumbs={breadcrumbs}
        />
        
        <div className="flex-1 overflow-auto p-6">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground">
              Welcome back, {session.user.name.split(' ')[0]}
            </h1>
            <p className="text-muted-foreground mt-1">
              Here's what's happening with {tenant.name} today.
            </p>
          </div>

          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-card p-6 rounded-lg border border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Members</p>
                  <p className="text-2xl font-bold text-foreground">{dashboardData.memberCount}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-green-600 font-medium">+12%</span>
                <span className="text-muted-foreground ml-2">from last month</span>
              </div>
            </div>

            <div className="bg-card p-6 rounded-lg border border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Sessions</p>
                  <p className="text-2xl font-bold text-foreground">142</p>
                </div>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                  <Activity className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-green-600 font-medium">+8%</span>
                <span className="text-muted-foreground ml-2">from yesterday</span>
              </div>
            </div>

            <div className="bg-card p-6 rounded-lg border border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">API Requests</p>
                  <p className="text-2xl font-bold text-foreground">1,429</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                  <Zap className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-red-600 font-medium">-2%</span>
                <span className="text-muted-foreground ml-2">from last week</span>
              </div>
            </div>

            <div className="bg-card p-6 rounded-lg border border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Security Score</p>
                  <p className="text-2xl font-bold text-foreground">98%</p>
                </div>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-green-600 font-medium">Excellent</span>
                <span className="text-muted-foreground ml-2">security posture</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Activity */}
            <div className="lg:col-span-2">
              <div className="bg-card rounded-lg border border-border">
                <div className="p-6 border-b border-border">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-foreground">Recent Activity</h3>
                    <a href={`/${tenant.slug}/audit`} className="text-sm text-primary hover:text-primary/80 font-medium">
                      View all
                    </a>
                  </div>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {dashboardData.recentLogs.map((log) => (
                      <div key={log.id} className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
                          <UserPlus className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground">
                            <span className="font-medium">{log.action}</span> on {log.resource}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {log.createdAt.toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                    {dashboardData.recentLogs.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No recent activity to display
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Onboarding Checklist */}
            <div className="bg-card rounded-lg border border-border">
              <div className="p-6 border-b border-border">
                <h3 className="text-lg font-semibold text-foreground">Setup Progress</h3>
                <p className="text-sm text-muted-foreground mt-1">Complete your tenant setup</p>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-sm text-foreground">Create tenant account</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-sm text-foreground">Set up authentication</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-sm text-foreground">Configure roles & permissions</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center">
                      <span className="w-2 h-2 bg-white rounded-full"></span>
                    </div>
                    <span className="text-sm text-muted-foreground">Invite team members</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-5 h-5 border-2 border-border rounded-full"></div>
                    <span className="text-sm text-muted-foreground">Set up API keys</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-5 h-5 border-2 border-border rounded-full"></div>
                    <span className="text-sm text-muted-foreground">Configure audit logging</span>
                  </div>
                </div>
                <div className="mt-6">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium text-foreground">3/6 completed</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: '50%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions Section */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <button className="p-4 bg-card border border-border rounded-lg hover:bg-muted transition-colors text-left">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                    <UserPlus className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">Invite Member</h4>
                    <p className="text-sm text-muted-foreground">Add a new team member</p>
                  </div>
                </div>
              </button>

              <button className="p-4 bg-card border border-border rounded-lg hover:bg-muted transition-colors text-left">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                    <Key className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">Create API Key</h4>
                    <p className="text-sm text-muted-foreground">Generate new API access</p>
                  </div>
                </div>
              </button>

              <button className="p-4 bg-card border border-border rounded-lg hover:bg-muted transition-colors text-left">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                    <Shield className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">Manage Roles</h4>
                    <p className="text-sm text-muted-foreground">Configure permissions</p>
                  </div>
                </div>
              </button>

              <button className="p-4 bg-card border border-border rounded-lg hover:bg-muted transition-colors text-left">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">View Audit Logs</h4>
                    <p className="text-sm text-muted-foreground">Monitor system activity</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
