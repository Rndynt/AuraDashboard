import { auth } from '@acme/auth/src/auth.js';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { db, withTransaction } from '@acme/db/src/connection.js';
import { tenants, apiKeys, users } from '@acme/db/src/schema.js';
import { eq, desc } from 'drizzle-orm';
import { Sidebar } from '@acme/ui/src/components/sidebar.js';
import { Header } from '@acme/ui/src/components/header.js';
import { getUserPermissions } from '@acme/rbac/src/guards.js';
import { PERMISSIONS } from '@acme/rbac/src/permissions.js';
import { 
  Key, 
  Plus, 
  MoreHorizontal,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  Calendar,
  User
} from 'lucide-react';

interface ApiKeysPageProps {
  params: {
    tenant: string;
  };
}

export default async function ApiKeysPage({ params }: ApiKeysPageProps) {
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

  // Check permission to view API keys
  if (!session.user.isSuperuser && !userPermissions.includes(PERMISSIONS.APIKEY_VIEW)) {
    redirect(`/${tenant.slug}/dashboard`);
  }

  // Get API keys data within tenant context
  const apiKeysData = await withTransaction(async (tx) => {
    const keys = await tx
      .select({
        id: apiKeys.id,
        name: apiKeys.name,
        scopes: apiKeys.scopes,
        lastUsedAt: apiKeys.lastUsedAt,
        expiresAt: apiKeys.expiresAt,
        createdAt: apiKeys.createdAt,
        creator: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
      })
      .from(apiKeys)
      .innerJoin(users, eq(apiKeys.createdBy, users.id))
      .where(eq(apiKeys.tenantId, tenant.id))
      .orderBy(desc(apiKeys.createdAt));

    return { keys };
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
    { label: 'API Keys' },
  ];

  const canCreateKeys = user.isSuperuser || userPermissions.includes(PERMISSIONS.APIKEY_CREATE);
  const canRevokeKeys = user.isSuperuser || userPermissions.includes(PERMISSIONS.APIKEY_REVOKE);

  const activeKeys = apiKeysData.keys.filter(key => 
    !key.expiresAt || key.expiresAt > new Date()
  );

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
              <h1 className="text-2xl font-bold text-foreground">API Keys</h1>
              <p className="text-muted-foreground mt-1">
                Manage API keys for programmatic access to your tenant
              </p>
            </div>
            {canCreateKeys && (
              <button className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors">
                <Plus className="w-4 h-4 mr-2" />
                Create API Key
              </button>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-card p-6 rounded-lg border border-border">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mr-4">
                  <Key className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Keys</p>
                  <p className="text-2xl font-bold text-foreground">{apiKeysData.keys.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-card p-6 rounded-lg border border-border">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mr-4">
                  <Eye className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Keys</p>
                  <p className="text-2xl font-bold text-foreground">{activeKeys.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-card p-6 rounded-lg border border-border">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mr-4">
                  <Calendar className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Last Used</p>
                  <p className="text-2xl font-bold text-foreground">
                    {apiKeysData.keys.some(k => k.lastUsedAt) ? 'Recently' : 'Never'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* API Keys Table */}
          <div className="bg-card rounded-lg border border-border">
            <div className="p-6 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground">API Keys</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">
                      Name
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">
                      Scopes
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">
                      Last Used
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">
                      Created By
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">
                      Status
                    </th>
                    {canRevokeKeys && (
                      <th className="text-right py-4 px-6 text-sm font-medium text-muted-foreground">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {apiKeysData.keys.map((key) => {
                    const isExpired = key.expiresAt && key.expiresAt < new Date();
                    const scopes = Array.isArray(key.scopes) ? key.scopes : [];
                    
                    return (
                      <tr key={key.id} className="border-b border-border last:border-b-0 hover:bg-muted/50">
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                              <Key className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{key.name}</p>
                              <p className="text-xs text-muted-foreground">
                                Created {key.createdAt.toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex flex-wrap gap-1">
                            {scopes.slice(0, 2).map((scope: string, index: number) => (
                              <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                {scope}
                              </span>
                            ))}
                            {scopes.length > 2 && (
                              <span className="text-xs text-muted-foreground">
                                +{scopes.length - 2} more
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-sm text-muted-foreground">
                          {key.lastUsedAt ? key.lastUsedAt.toLocaleDateString() : 'Never'}
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
                              <span className="text-xs font-medium text-white">
                                {key.creator.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <span className="text-sm text-foreground">{key.creator.name}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            isExpired
                              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          }`}>
                            {isExpired ? 'Expired' : 'Active'}
                          </span>
                        </td>
                        {canRevokeKeys && (
                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors">
                                <Copy className="w-4 h-4" />
                              </button>
                              <button className="p-2 text-muted-foreground hover:text-destructive hover:bg-muted rounded-md transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {apiKeysData.keys.length === 0 && (
            <div className="bg-card rounded-lg border border-border p-12 text-center">
              <Key className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No API keys yet</h3>
              <p className="text-muted-foreground mb-6">
                Create your first API key to enable programmatic access to your tenant.
              </p>
              {canCreateKeys && (
                <button className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors">
                  <Plus className="w-4 h-4 mr-2" />
                  Create API Key
                </button>
              )}
            </div>
          )}

          {/* Security Notice */}
          <div className="mt-6 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex">
              <EyeOff className="w-5 h-5 text-yellow-600 mt-0.5 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Security Notice
                </h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  API keys provide full access to your tenant. Store them securely and rotate them regularly. 
                  Never share API keys in client-side code or public repositories.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
