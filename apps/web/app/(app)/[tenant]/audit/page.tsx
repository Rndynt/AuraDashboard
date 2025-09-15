import { auth } from '@acme/auth/src/auth.js';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { db, withTransaction } from '@acme/db/src/connection.js';
import { tenants, auditLogs, users } from '@acme/db/src/schema.js';
import { eq, desc, and, gte, sql } from 'drizzle-orm';
import { Sidebar } from '@acme/ui/src/components/sidebar.js';
import { Header } from '@acme/ui/src/components/header.js';
import { getUserPermissions } from '@acme/rbac/src/guards.js';
import { PERMISSIONS } from '@acme/rbac/src/permissions.js';
import { 
  FileText, 
  Activity, 
  User,
  Calendar,
  Filter,
  Download,
  Search,
  UserPlus,
  Shield,
  Key,
  Settings,
  Trash2,
  Edit
} from 'lucide-react';

interface AuditPageProps {
  params: {
    tenant: string;
  };
  searchParams: {
    action?: string;
    resource?: string;
    actor?: string;
    days?: string;
  };
}

const ACTION_ICONS: Record<string, React.ReactNode> = {
  'user.invite': <UserPlus className="w-4 h-4" />,
  'user.update': <Edit className="w-4 h-4" />,
  'user.delete': <Trash2 className="w-4 h-4" />,
  'role.create': <Shield className="w-4 h-4" />,
  'role.update': <Shield className="w-4 h-4" />,
  'role.delete': <Shield className="w-4 h-4" />,
  'apikey.create': <Key className="w-4 h-4" />,
  'apikey.revoke': <Key className="w-4 h-4" />,
  'tenant.update': <Settings className="w-4 h-4" />,
};

export default async function AuditPage({ params, searchParams }: AuditPageProps) {
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

  // Get user permissions
  const userPermissions = await getUserPermissions(session.user.id, tenant.id);

  // Check permission to view audit logs
  if (!session.user.isSuperuser && !userPermissions.includes(PERMISSIONS.AUDIT_VIEW)) {
    redirect(`/${tenant.slug}/dashboard`);
  }

  // Parse filters
  const daysFilter = parseInt(searchParams.days || '30');
  const dateFilter = new Date();
  dateFilter.setDate(dateFilter.getDate() - daysFilter);

  // Get audit logs data within tenant context
  const auditData = await withTransaction(async (tx) => {
    let query = tx
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
      .where(
        and(
          eq(auditLogs.tenantId, tenant.id),
          gte(auditLogs.createdAt, dateFilter)
        )
      )
      .orderBy(desc(auditLogs.createdAt))
      .limit(100);

    // Apply filters
    if (searchParams.action) {
      query = query.where(and(
        eq(auditLogs.tenantId, tenant.id),
        eq(auditLogs.action, searchParams.action),
        gte(auditLogs.createdAt, dateFilter)
      ));
    }

    if (searchParams.resource) {
      query = query.where(and(
        eq(auditLogs.tenantId, tenant.id),
        eq(auditLogs.resource, searchParams.resource),
        gte(auditLogs.createdAt, dateFilter)
      ));
    }

    const logs = await query;

    // Get summary stats
    const [statsResult] = await tx
      .select({
        totalLogs: sql<number>`count(*)`,
        uniqueActors: sql<number>`count(distinct actor_user_id)`,
        uniqueActions: sql<number>`count(distinct action)`,
      })
      .from(auditLogs)
      .where(
        and(
          eq(auditLogs.tenantId, tenant.id),
          gte(auditLogs.createdAt, dateFilter)
        )
      );

    // Get unique actions and resources for filters
    const actions = await tx
      .selectDistinct({ action: auditLogs.action })
      .from(auditLogs)
      .where(eq(auditLogs.tenantId, tenant.id))
      .orderBy(auditLogs.action);

    const resources = await tx
      .selectDistinct({ resource: auditLogs.resource })
      .from(auditLogs)
      .where(eq(auditLogs.tenantId, tenant.id))
      .orderBy(auditLogs.resource);

    return { 
      logs, 
      stats: statsResult || { totalLogs: 0, uniqueActors: 0, uniqueActions: 0 },
      actions: actions.map(a => a.action),
      resources: resources.map(r => r.resource),
    };
  }, tenant.id);

  const user = {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    isSuperuser: session.user.isSuperuser || false,
    permissions: userPermissions,
  };

  const breadcrumbs = [
    { label: 'Dashboard', href: `/${tenant.slug}/dashboard` },
    { label: 'Audit Logs' },
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
        memberCount={0}
        onTenantSwitch={() => {}}
        onProfileMenu={() => {}}
      />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <Header 
          user={user}
          breadcrumbs={breadcrumbs}
        />
        
        <div className="flex-1 overflow-auto p-6">
          {/* Page Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Audit Logs</h1>
              <p className="text-muted-foreground mt-1">
                Monitor and track all activities within your tenant
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button className="inline-flex items-center px-4 py-2 border border-border text-sm font-medium rounded-md text-foreground bg-background hover:bg-muted transition-colors">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </button>
              <button className="inline-flex items-center px-4 py-2 border border-border text-sm font-medium rounded-md text-foreground bg-background hover:bg-muted transition-colors">
                <Download className="w-4 h-4 mr-2" />
                Export
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-card p-6 rounded-lg border border-border">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mr-4">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Events</p>
                  <p className="text-2xl font-bold text-foreground">{auditData.stats.totalLogs}</p>
                </div>
              </div>
            </div>

            <div className="bg-card p-6 rounded-lg border border-border">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mr-4">
                  <User className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                  <p className="text-2xl font-bold text-foreground">{auditData.stats.uniqueActors}</p>
                </div>
              </div>
            </div>

            <div className="bg-card p-6 rounded-lg border border-border">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mr-4">
                  <Activity className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Action Types</p>
                  <p className="text-2xl font-bold text-foreground">{auditData.stats.uniqueActions}</p>
                </div>
              </div>
            </div>

            <div className="bg-card p-6 rounded-lg border border-border">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center mr-4">
                  <Calendar className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Time Range</p>
                  <p className="text-2xl font-bold text-foreground">{daysFilter}d</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-card rounded-lg border border-border p-4 mb-6">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-64">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search audit logs..."
                    className="w-full pl-10 pr-4 py-2 border border-input rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
              <select className="px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">All Actions</option>
                {auditData.actions.map((action) => (
                  <option key={action} value={action}>{action}</option>
                ))}
              </select>
              <select className="px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">All Resources</option>
                {auditData.resources.map((resource) => (
                  <option key={resource} value={resource}>{resource}</option>
                ))}
              </select>
              <select className="px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="30">Last 30 days</option>
                <option value="7">Last 7 days</option>
                <option value="1">Last 24 hours</option>
                <option value="90">Last 90 days</option>
              </select>
            </div>
          </div>

          {/* Audit Logs */}
          <div className="bg-card rounded-lg border border-border">
            <div className="p-6 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground">Activity Timeline</h3>
            </div>
            <div className="divide-y divide-border">
              {auditData.logs.map((log) => {
                const actionIcon = ACTION_ICONS[log.action] || <Activity className="w-4 h-4" />;
                const metadata = log.metadata as Record<string, any> || {};
                
                return (
                  <div key={log.id} className="p-6 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start space-x-4">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center flex-shrink-0">
                        {actionIcon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <p className="text-sm font-medium text-foreground">
                              {log.actor?.name || 'System'}
                            </p>
                            <span className="text-sm text-muted-foreground">•</span>
                            <p className="text-sm text-foreground">
                              {log.action} on {log.resource}
                            </p>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {log.createdAt.toLocaleString()}
                          </p>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {log.actor?.email || 'system@tenant.local'}
                        </p>
                        {Object.keys(metadata).length > 0 && (
                          <div className="mt-2 p-2 bg-muted rounded text-xs">
                            <details>
                              <summary className="cursor-pointer text-muted-foreground">
                                View details
                              </summary>
                              <pre className="mt-2 text-foreground whitespace-pre-wrap">
                                {JSON.stringify(metadata, null, 2)}
                              </pre>
                            </details>
                          </div>
                        )}
                        {log.ipAddress && (
                          <p className="text-xs text-muted-foreground mt-2">
                            IP: {log.ipAddress}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {auditData.logs.length === 0 && (
            <div className="bg-card rounded-lg border border-border p-12 text-center">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No audit logs found</h3>
              <p className="text-muted-foreground">
                No activities match your current filters. Try adjusting the time range or filters.
              </p>
            </div>
          )}

          {/* Load More */}
          {auditData.logs.length === 100 && (
            <div className="mt-6 text-center">
              <button className="inline-flex items-center px-4 py-2 border border-border text-sm font-medium rounded-md text-foreground bg-background hover:bg-muted transition-colors">
                Load More Events
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
