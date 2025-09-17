import { auth } from '@acme/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { db, withTransaction } from '@acme/db/connection';
import { tenants } from '@acme/db/schema';
import { eq } from 'drizzle-orm';
import { Sidebar } from '@acme/ui/components/sidebar';
import { Header } from '@acme/ui/components/header';
import { getUserPermissions } from '@acme/rbac/guards';
import { PERMISSIONS } from '@acme/rbac/permissions';
import { 
  Settings, 
  Building2,
  Globe,
  Bell,
  Shield,
  Palette,
  Database,
  Trash2,
  Save
} from 'lucide-react';

interface SettingsPageProps {
  params: {
    tenant: string;
  };
}

export default async function SettingsPage({ params }: SettingsPageProps) {
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

  // Check permission to update tenant settings
  if (!session.user.isSuperuser && !userPermissions.includes(PERMISSIONS.TENANT_UPDATE)) {
    redirect(`/${tenant.slug}/dashboard`);
  }

  const user = {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    isSuperuser: session.user.isSuperuser || false,
    permissions: userPermissions,
  };

  const breadcrumbs = [
    { label: 'Dashboard', href: `/${tenant.slug}/dashboard` },
    { label: 'Settings' },
  ];

  const canDeleteTenant = user.isSuperuser || userPermissions.includes(PERMISSIONS.TENANT_DELETE);
  const canUpdateDashboard = user.isSuperuser || userPermissions.includes(PERMISSIONS.DASHBOARD_SETTINGS_UPDATE);

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
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground">Tenant Settings</h1>
            <p className="text-muted-foreground mt-1">
              Manage your tenant configuration and preferences
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Settings Navigation */}
            <div className="bg-card rounded-lg border border-border p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Settings</h3>
              <nav className="space-y-2">
                <a href="#general" className="flex items-center space-x-3 px-3 py-2 text-sm font-medium text-primary bg-primary/10 rounded-md">
                  <Building2 className="w-4 h-4" />
                  <span>General</span>
                </a>
                <a href="#domain" className="flex items-center space-x-3 px-3 py-2 text-sm text-foreground hover:bg-muted rounded-md transition-colors">
                  <Globe className="w-4 h-4" />
                  <span>Domain</span>
                </a>
                <a href="#notifications" className="flex items-center space-x-3 px-3 py-2 text-sm text-foreground hover:bg-muted rounded-md transition-colors">
                  <Bell className="w-4 h-4" />
                  <span>Notifications</span>
                </a>
                <a href="#security" className="flex items-center space-x-3 px-3 py-2 text-sm text-foreground hover:bg-muted rounded-md transition-colors">
                  <Shield className="w-4 h-4" />
                  <span>Security</span>
                </a>
                {canUpdateDashboard && (
                  <a href="#dashboard" className="flex items-center space-x-3 px-3 py-2 text-sm text-foreground hover:bg-muted rounded-md transition-colors">
                    <Palette className="w-4 h-4" />
                    <span>Dashboard</span>
                  </a>
                )}
                <a href="#data" className="flex items-center space-x-3 px-3 py-2 text-sm text-foreground hover:bg-muted rounded-md transition-colors">
                  <Database className="w-4 h-4" />
                  <span>Data & Export</span>
                </a>
              </nav>
            </div>

            {/* Settings Content */}
            <div className="lg:col-span-3 space-y-6">
              {/* General Settings */}
              <div id="general" className="bg-card rounded-lg border border-border p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <Building2 className="w-5 h-5 text-muted-foreground" />
                  <h3 className="text-lg font-semibold text-foreground">General Information</h3>
                </div>
                
                <form className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Tenant Name
                      </label>
                      <input
                        type="text"
                        defaultValue={tenant.name}
                        className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Tenant Slug
                      </label>
                      <input
                        type="text"
                        defaultValue={tenant.slug}
                        className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Description
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Describe your organization..."
                      className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Time Zone
                    </label>
                    <select className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                      <option>UTC (GMT+0)</option>
                      <option>EST (GMT-5)</option>
                      <option>PST (GMT-8)</option>
                      <option>CET (GMT+1)</option>
                    </select>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>

              {/* Domain Settings */}
              <div id="domain" className="bg-card rounded-lg border border-border p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <Globe className="w-5 h-5 text-muted-foreground" />
                  <h3 className="text-lg font-semibold text-foreground">Domain Configuration</h3>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Primary Domain
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        defaultValue={`${tenant.slug}.company.com`}
                        className="flex-1 px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        Verified
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Custom Domain
                    </label>
                    <input
                      type="text"
                      placeholder="your-domain.com"
                      className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Add a custom domain for your tenant
                    </p>
                  </div>
                </div>
              </div>

              {/* Security Settings */}
              <div id="security" className="bg-card rounded-lg border border-border p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <Shield className="w-5 h-5 text-muted-foreground" />
                  <h3 className="text-lg font-semibold text-foreground">Security</h3>
                </div>
                
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div>
                      <h4 className="font-medium text-foreground">Two-Factor Authentication</h4>
                      <p className="text-sm text-muted-foreground">Require 2FA for all team members</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-ring rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div>
                      <h4 className="font-medium text-foreground">Session Timeout</h4>
                      <p className="text-sm text-muted-foreground">Automatically log out inactive users</p>
                    </div>
                    <select className="px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                      <option>30 minutes</option>
                      <option>1 hour</option>
                      <option>2 hours</option>
                      <option>4 hours</option>
                      <option>8 hours</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div>
                      <h4 className="font-medium text-foreground">IP Allowlist</h4>
                      <p className="text-sm text-muted-foreground">Restrict access to specific IP addresses</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-ring rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Dashboard Settings */}
              {canUpdateDashboard && (
                <div id="dashboard" className="bg-card rounded-lg border border-border p-6">
                  <div className="flex items-center space-x-3 mb-6">
                    <Palette className="w-5 h-5 text-muted-foreground" />
                    <h3 className="text-lg font-semibold text-foreground">Dashboard Preferences</h3>
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Default Theme
                      </label>
                      <select className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                        <option>System</option>
                        <option>Light</option>
                        <option>Dark</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Dashboard Layout
                      </label>
                      <select className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                        <option>Compact</option>
                        <option>Comfortable</option>
                        <option>Spacious</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div>
                        <h4 className="font-medium text-foreground">Show Onboarding</h4>
                        <p className="text-sm text-muted-foreground">Display setup checklist for new users</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked className="sr-only peer" />
                        <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-ring rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Danger Zone */}
              {canDeleteTenant && (
                <div className="bg-card rounded-lg border border-destructive p-6">
                  <div className="flex items-center space-x-3 mb-6">
                    <Trash2 className="w-5 h-5 text-destructive" />
                    <h3 className="text-lg font-semibold text-destructive">Danger Zone</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="p-4 border border-destructive/20 rounded-lg bg-destructive/5">
                      <h4 className="font-medium text-foreground mb-2">Delete Tenant</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Permanently delete this tenant and all associated data. This action cannot be undone.
                      </p>
                      <button className="inline-flex items-center px-4 py-2 bg-destructive text-destructive-foreground text-sm font-medium rounded-md hover:bg-destructive/90 transition-colors">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Tenant
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
