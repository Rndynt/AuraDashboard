import { auth } from '@acme/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { db, withTransaction } from '@acme/db/connection';
import { tenants, memberships, users, roles } from '@acme/db/schema';
import { eq, and } from 'drizzle-orm';
import { Sidebar } from '@acme/ui/components/sidebar';
import { Header } from '@acme/ui/components/header';
import { getUserPermissions } from '@acme/rbac/guards';
import { PERMISSIONS } from '@acme/rbac/permissions';
import { 
  Users, 
  MoreHorizontal, 
  UserPlus,
  Shield,
  Mail,
  Calendar,
  Badge
} from 'lucide-react';

interface MembersPageProps {
  params: {
    tenant: string;
  };
}

export default async function MembersPage({ params }: MembersPageProps) {
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
  const permissions = await getUserPermissions(session.user.id, tenant.id);

  // Check permission to view members
  if (!session.user.isSuperuser && !permissions.includes(PERMISSIONS.MEMBER_VIEW)) {
    redirect(`/${tenant.slug}/dashboard`);
  }

  // Get members data within tenant context
  const membersData = await withTransaction(async (tx) => {
    const members = await tx
      .select({
        id: memberships.id,
        status: memberships.status,
        joinedAt: memberships.createdAt,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
          status: users.status,
        },
        role: {
          id: roles.id,
          name: roles.name,
        },
      })
      .from(memberships)
      .innerJoin(users, eq(memberships.userId, users.id))
      .innerJoin(roles, eq(memberships.roleId, roles.id))
      .where(eq(memberships.tenantId, tenant.id))
      .orderBy(memberships.createdAt);

    return { members };
  }, tenant.id);

  const user = {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    isSuperuser: session.user.isSuperuser || false,
    permissions,
  };

  const breadcrumbs = [
    { label: 'Dashboard', href: `/${tenant.slug}/dashboard` },
    { label: 'Team Members' },
  ];

  const canInviteMembers = user.isSuperuser || permissions.includes(PERMISSIONS.MEMBER_INVITE);
  const canManageMembers = user.isSuperuser || permissions.includes(PERMISSIONS.MEMBER_MANAGE);

  return (
    <div className="flex h-screen bg-background">
      <Sidebar 
        user={user}
        tenant={{
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
        }}
        memberCount={membersData.members.length}
        onTenantSwitch={() => {}}
        onProfileMenu={() => {}}
      />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <Header 
          user={user}
          breadcrumbs={breadcrumbs}
          onInviteMember={canInviteMembers ? () => {} : undefined}
        />
        
        <div className="flex-1 overflow-auto p-6">
          {/* Page Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Team Members</h1>
              <p className="text-muted-foreground mt-1">
                Manage your team members and their roles
              </p>
            </div>
            {canInviteMembers && (
              <button className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors">
                <UserPlus className="w-4 h-4 mr-2" />
                Invite Member
              </button>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-card p-6 rounded-lg border border-border">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mr-4">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Members</p>
                  <p className="text-2xl font-bold text-foreground">{membersData.members.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-card p-6 rounded-lg border border-border">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mr-4">
                  <Badge className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Members</p>
                  <p className="text-2xl font-bold text-foreground">
                    {membersData.members.filter(m => m.status === 'active').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-card p-6 rounded-lg border border-border">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mr-4">
                  <Shield className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Admins</p>
                  <p className="text-2xl font-bold text-foreground">
                    {membersData.members.filter(m => m.role.name === 'Admin' || m.role.name === 'Owner').length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Members Table */}
          <div className="bg-card rounded-lg border border-border">
            <div className="p-6 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground">All Members</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">
                      Member
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">
                      Role
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">
                      Joined
                    </th>
                    {canManageMembers && (
                      <th className="text-right py-4 px-6 text-sm font-medium text-muted-foreground">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {membersData.members.map((member) => (
                    <tr key={member.id} className="border-b border-border last:border-b-0 hover:bg-muted/50">
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-white">
                              {member.user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{member.user.name}</p>
                            <p className="text-sm text-muted-foreground">{member.user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          {member.role.name}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          member.status === 'active' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                          {member.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm text-muted-foreground">
                        {member.joinedAt.toLocaleDateString()}
                      </td>
                      {canManageMembers && (
                        <td className="py-4 px-6 text-right">
                          <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {membersData.members.length === 0 && (
            <div className="bg-card rounded-lg border border-border p-12 text-center">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No members yet</h3>
              <p className="text-muted-foreground mb-6">
                Start building your team by inviting the first member.
              </p>
              {canInviteMembers && (
                <button className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Invite Member
                </button>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
