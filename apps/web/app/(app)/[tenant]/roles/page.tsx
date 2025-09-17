import { auth } from '@acme/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { db, withTransaction } from '@acme/db/connection';
import { tenants, roles, permissions, rolePermissions } from '@acme/db/schema';
import { eq, and, isNull, or } from 'drizzle-orm';
import { Sidebar } from '@acme/ui/components/sidebar';
import { Header } from '@acme/ui/components/header';
import { getUserPermissions } from '@acme/rbac/guards';
import { PERMISSIONS } from '@acme/rbac/permissions';
import { 
  Shield, 
  Users, 
  Key,
  Plus,
  Settings,
  Lock
} from 'lucide-react';

interface RolesPageProps {
  params: {
    tenant: string;
  };
}

export default async function RolesPage({ params }: RolesPageProps) {
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

  // Check permission to view roles
  if (!session.user.isSuperuser && !userPermissions.includes(PERMISSIONS.ROLE_VIEW)) {
    redirect(`/${tenant.slug}/dashboard`);
  }

  // Get roles and permissions data within tenant context
  const rolesData = await withTransaction(async (tx) => {
    // Get tenant-specific roles and global default roles
    const tenantRoles = await tx
      .select({
        id: roles.id,
        name: roles.name,
        description: roles.description,
        tenantId: roles.tenantId,
        createdAt: roles.createdAt,
      })
      .from(roles)
      .where(or(eq(roles.tenantId, tenant.id), isNull(roles.tenantId)))
      .orderBy(roles.name);

    // Get all permissions
    const allPermissions = await tx
      .select()
      .from(permissions)
      .orderBy(permissions.key);

    // Get role-permission mappings
    const rolePermissionMappings = await tx
      .select({
        roleId: rolePermissions.roleId,
        permissionKey: permissions.key,
      })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id));

    // Group permissions by role
    const rolePermissionsMap = new Map<string, string[]>();
    rolePermissionMappings.forEach(mapping => {
      if (!rolePermissionsMap.has(mapping.roleId)) {
        rolePermissionsMap.set(mapping.roleId, []);
      }
      rolePermissionsMap.get(mapping.roleId)!.push(mapping.permissionKey);
    });

    const rolesWithPermissions = tenantRoles.map(role => ({
      ...role,
      permissions: rolePermissionsMap.get(role.id) || [],
      isGlobal: role.tenantId === null,
    }));

    return { 
      roles: rolesWithPermissions, 
      allPermissions: allPermissions 
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
    { label: 'Roles & Permissions' },
  ];

  const canManageRoles = user.isSuperuser || userPermissions.includes(PERMISSIONS.ROLE_MANAGE);

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
              <h1 className="text-2xl font-bold text-foreground">Roles & Permissions</h1>
              <p className="text-muted-foreground mt-1">
                Manage access control and permissions for your team
              </p>
            </div>
            {canManageRoles && (
              <button className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors">
                <Plus className="w-4 h-4 mr-2" />
                Create Role
              </button>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-card p-6 rounded-lg border border-border">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mr-4">
                  <Shield className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Roles</p>
                  <p className="text-2xl font-bold text-foreground">{rolesData.roles.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-card p-6 rounded-lg border border-border">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mr-4">
                  <Key className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Permissions</p>
                  <p className="text-2xl font-bold text-foreground">{rolesData.allPermissions.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-card p-6 rounded-lg border border-border">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mr-4">
                  <Settings className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Custom Roles</p>
                  <p className="text-2xl font-bold text-foreground">
                    {rolesData.roles.filter(r => !r.isGlobal).length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Roles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {rolesData.roles.map((role) => (
              <div key={role.id} className="bg-card rounded-lg border border-border p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      role.isGlobal 
                        ? 'bg-yellow-100 dark:bg-yellow-900' 
                        : 'bg-blue-100 dark:bg-blue-900'
                    }`}>
                      {role.isGlobal ? (
                        <Lock className="w-5 h-5 text-yellow-600" />
                      ) : (
                        <Shield className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{role.name}</h3>
                      {role.isGlobal && (
                        <span className="text-xs text-yellow-600 font-medium">Default Role</span>
                      )}
                    </div>
                  </div>
                  {canManageRoles && !role.isGlobal && (
                    <button className="p-1 text-muted-foreground hover:text-foreground">
                      <Settings className="w-4 h-4" />
                    </button>
                  )}
                </div>
                
                {role.description && (
                  <p className="text-sm text-muted-foreground mb-4">{role.description}</p>
                )}
                
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">
                    Permissions ({role.permissions.length})
                  </p>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {role.permissions.slice(0, 5).map((permission) => (
                      <div key={permission} className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                        {permission}
                      </div>
                    ))}
                    {role.permissions.length > 5 && (
                      <div className="text-xs text-muted-foreground">
                        +{role.permissions.length - 5} more permissions
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Permissions Matrix */}
          <div className="bg-card rounded-lg border border-border">
            <div className="p-6 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground">Permission Matrix</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Overview of all permissions across roles
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground min-w-64">
                      Permission
                    </th>
                    {rolesData.roles.map((role) => (
                      <th key={role.id} className="text-center py-4 px-3 text-sm font-medium text-muted-foreground min-w-20">
                        {role.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rolesData.allPermissions.map((permission) => (
                    <tr key={permission.id} className="border-b border-border last:border-b-0 hover:bg-muted/50">
                      <td className="py-3 px-6">
                        <div>
                          <p className="font-medium text-foreground text-sm">{permission.key}</p>
                          <p className="text-xs text-muted-foreground">{permission.description}</p>
                        </div>
                      </td>
                      {rolesData.roles.map((role) => (
                        <td key={role.id} className="py-3 px-3 text-center">
                          {role.permissions.includes(permission.key) ? (
                            <div className="w-4 h-4 bg-green-500 rounded-full mx-auto"></div>
                          ) : (
                            <div className="w-4 h-4 bg-muted rounded-full mx-auto"></div>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
