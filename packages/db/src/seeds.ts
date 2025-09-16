import { db } from './connection';
import { 
  tenants, 
  user,
  users, 
  roles, 
  permissions, 
  rolePermissions, 
  memberships,
  auditLogs,
  account 
} from './schema';
import { isNull, eq } from 'drizzle-orm';
import { auth } from '../../auth/src/auth';

// Constants inline to avoid module resolution issues
const PERMISSIONS = {
  TENANT_CREATE: 'tenant.create',
  TENANT_UPDATE: 'tenant.update', 
  TENANT_DELETE: 'tenant.delete',
  MEMBER_INVITE: 'member.invite',
  MEMBER_MANAGE: 'member.manage',
  MEMBER_VIEW: 'member.view',
  ROLE_VIEW: 'role.view',
  ROLE_MANAGE: 'role.manage',
  AUDIT_VIEW: 'audit.view',
  APIKEY_CREATE: 'apikey.create',
  APIKEY_VIEW: 'apikey.view',
  APIKEY_REVOKE: 'apikey.revoke',
  PROFILE_VIEW: 'profile.view',
  PROFILE_UPDATE: 'profile.update',
  DASHBOARD_VIEW: 'dashboard.view',
  DASHBOARD_SETTINGS_UPDATE: 'dashboard.settings.update',
} as const;

const DEFAULT_ROLES = {
  OWNER: 'Owner',
  ADMIN: 'Admin', 
  MEMBER: 'Member',
  VIEWER: 'Viewer',
} as const;

const ROLE_PERMISSIONS = {
  [DEFAULT_ROLES.OWNER]: [
    PERMISSIONS.TENANT_CREATE,
    PERMISSIONS.TENANT_UPDATE,
    PERMISSIONS.TENANT_DELETE,
    PERMISSIONS.MEMBER_INVITE,
    PERMISSIONS.MEMBER_MANAGE,
    PERMISSIONS.MEMBER_VIEW,
    PERMISSIONS.ROLE_VIEW,
    PERMISSIONS.ROLE_MANAGE,
    PERMISSIONS.AUDIT_VIEW,
    PERMISSIONS.APIKEY_CREATE,
    PERMISSIONS.APIKEY_VIEW,
    PERMISSIONS.APIKEY_REVOKE,
    PERMISSIONS.PROFILE_VIEW,
    PERMISSIONS.PROFILE_UPDATE,
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.DASHBOARD_SETTINGS_UPDATE,
  ],
  [DEFAULT_ROLES.ADMIN]: [
    PERMISSIONS.TENANT_UPDATE,
    PERMISSIONS.MEMBER_INVITE,
    PERMISSIONS.MEMBER_MANAGE,
    PERMISSIONS.MEMBER_VIEW,
    PERMISSIONS.ROLE_VIEW,
    PERMISSIONS.AUDIT_VIEW,
    PERMISSIONS.APIKEY_CREATE,
    PERMISSIONS.APIKEY_VIEW,
    PERMISSIONS.APIKEY_REVOKE,
    PERMISSIONS.PROFILE_VIEW,
    PERMISSIONS.PROFILE_UPDATE,
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.DASHBOARD_SETTINGS_UPDATE,
  ],
  [DEFAULT_ROLES.MEMBER]: [
    PERMISSIONS.MEMBER_VIEW,
    PERMISSIONS.PROFILE_VIEW,
    PERMISSIONS.PROFILE_UPDATE,
    PERMISSIONS.DASHBOARD_VIEW,
  ],
  [DEFAULT_ROLES.VIEWER]: [
    PERMISSIONS.MEMBER_VIEW,
    PERMISSIONS.PROFILE_VIEW,
    PERMISSIONS.DASHBOARD_VIEW,
  ],
} as const;

// Environment variables directly
const env = {
  SUPERUSER_EMAIL: process.env.SUPERUSER_EMAIL || 'admin@example.com',
  SUPERUSER_NAME: process.env.SUPERUSER_NAME || 'Admin'
};

// Simple logger
const logger = {
  info: (msg: string, ...args: any[]) => console.log(`ℹ️  ${msg}`, ...args),
  error: (msg: string, ...args: any[]) => console.error(`❌ ${msg}`, ...args)
};

// Helper function to create users with better-auth
async function upsertUserWithPassword(email: string, name: string, password: string, isSuperuser = false) {
  try {
    // Check if user already exists
    let [existingUser] = await db
      .select()
      .from(user)
      .where(eq(user.email, email));

    if (existingUser) {
      logger.info(`User already exists: ${email}`);
      return existingUser;
    }

    // Use better-auth to create user with password
    // This ensures password hashing is compatible
    const signUpResult = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name,
      },
    });

    if (!signUpResult.user) {
      throw new Error(`Failed to create user via better-auth: ${email}`);
    }

    logger.info(`Created user via better-auth: ${email} with ID: ${signUpResult.user.id}`);

    // Update user with additional fields if needed
    if (isSuperuser) {
      await db
        .update(user)
        .set({ isSuperuser: true })
        .where(eq(user.id, signUpResult.user.id));
      
      logger.info(`Updated user ${email} to superuser`);
    }

    return signUpResult.user;
  } catch (error) {
    logger.error(`Failed to create user ${email}:`, error);
    return null;
  }
}

export async function seedDatabase() {
  logger.info('Starting database seeding...');

  try {
    // 1. Create superuser with better-auth
    logger.info('Creating superuser with credentials...');
    const superuser = await upsertUserWithPassword(
      env.SUPERUSER_EMAIL,
      env.SUPERUSER_NAME,
      'superuser123!',
      true
    );

    if (superuser) {
      logger.info(`Superuser created: ${superuser.email}`);
    } else {
      logger.error('Failed to create superuser');
      throw new Error('Failed to create superuser');
    }

    // 2. Ensure all permissions exist
    logger.info('Creating permissions...');
    const permissionValues = Object.entries(PERMISSIONS).map(([key, value]) => ({
      key: value,
      description: `Permission for ${value}`,
    }));

    await db
      .insert(permissions)
      .values(permissionValues)
      .onConflictDoNothing();

    logger.info(`Created ${permissionValues.length} permissions`);

    // 3. Create default global roles
    logger.info('Creating default roles...');
    const roleValues = Object.entries(DEFAULT_ROLES).map(([key, name]) => ({
      tenantId: null, // Global roles
      name,
      description: `Default ${name} role`,
    }));

    const createdRoles = await db
      .insert(roles)
      .values(roleValues)
      .onConflictDoNothing()
      .returning();

    logger.info(`Created ${createdRoles.length} default roles`);

    // 4. Assign permissions to default roles
    logger.info('Assigning permissions to roles...');
    
    // Get all permissions and roles
    const allPermissions = await db.select().from(permissions);
    const allRoles = await db.select().from(roles).where(isNull(roles.tenantId));

    const permissionMap = new Map(allPermissions.map(p => [p.key, p.id]));
    const roleMap = new Map(allRoles.map(r => [r.name, r.id]));

    const rolePermissionValues: { roleId: string; permissionId: string; }[] = [];
    
    for (const [roleName, permissionKeys] of Object.entries(ROLE_PERMISSIONS)) {
      const roleId = roleMap.get(roleName);
      if (!roleId) continue;

      for (const permissionKey of permissionKeys) {
        const permissionId = permissionMap.get(permissionKey);
        if (!permissionId) continue;

        rolePermissionValues.push({
          roleId,
          permissionId,
        });
      }
    }

    await db
      .insert(rolePermissions)
      .values(rolePermissionValues)
      .onConflictDoNothing();

    logger.info(`Assigned ${rolePermissionValues.length} permission-role mappings`);

    // 5. Create or get sample tenant
    logger.info('Creating sample tenant...');
    let [sampleTenant] = await db
      .insert(tenants)
      .values({
        slug: 'acme-corp',
        name: 'Acme Corporation',
        status: 'active',
      })
      .onConflictDoNothing()
      .returning();

    // If tenant already exists, get it
    if (!sampleTenant) {
      [sampleTenant] = await db
        .select()
        .from(tenants)
        .where(eq(tenants.slug, 'acme-corp'));
      logger.info('Using existing sample tenant: acme-corp');
    } else {
      logger.info(`Sample tenant created: ${sampleTenant.slug}`);
    }

    if (sampleTenant) {
      // 6. Materialize roles for the sample tenant (if not already done)
      logger.info('Materializing roles for sample tenant...');
      const tenantRoles = roleValues.map(role => ({
        ...role,
        tenantId: sampleTenant.id,
      }));

      let materializedRoles = await db
        .insert(roles)
        .values(tenantRoles)
        .onConflictDoNothing()
        .returning();

      // If roles already exist, get them
      if (materializedRoles.length === 0) {
        materializedRoles = await db
          .select()
          .from(roles)
          .where(eq(roles.tenantId, sampleTenant.id));
        logger.info('Using existing tenant roles');
      }

      // Copy role-permission mappings for tenant-specific roles
      const materializedRoleMap = new Map(materializedRoles.map(r => [r.name, r.id]));
      const tenantRolePermissionValues: { roleId: string; permissionId: string; }[] = [];

      for (const [roleName, permissionKeys] of Object.entries(ROLE_PERMISSIONS)) {
        const roleId = materializedRoleMap.get(roleName);
        if (!roleId) continue;

        for (const permissionKey of permissionKeys) {
          const permissionId = permissionMap.get(permissionKey);
          if (!permissionId) continue;

          tenantRolePermissionValues.push({
            roleId,
            permissionId,
          });
        }
      }

      if (tenantRolePermissionValues.length > 0) {
        await db
          .insert(rolePermissions)
          .values(tenantRolePermissionValues)
          .onConflictDoNothing();
      }

      // 7. Create superuser membership in sample tenant
      const ownerRole = materializedRoles.find(r => r.name === DEFAULT_ROLES.OWNER);
      if (ownerRole && superuser) {
        await db
          .insert(memberships)
          .values({
            userId: superuser.id,
            tenantId: sampleTenant.id,
            roleId: ownerRole.id,
            status: 'active',
          })
          .onConflictDoNothing();

        logger.info('Superuser membership created in sample tenant');
      }

      // 8. Create sample users with better-auth
      logger.info('Creating sample users with credentials...');
      const adminUser = await upsertUserWithPassword(
        'admin@acme.com',
        'Admin User',
        'admin123!'
      );

      const memberUser = await upsertUserWithPassword(
        'member@acme.com',
        'Member User',
        'member123!'
      );

      const createdUsers = [adminUser, memberUser].filter(Boolean);

      // Create memberships for sample users
      const adminRole = materializedRoles.find(r => r.name === DEFAULT_ROLES.ADMIN);
      const memberRole = materializedRoles.find(r => r.name === DEFAULT_ROLES.MEMBER);

      if (createdUsers.length >= 2 && adminRole && memberRole && createdUsers[0] && createdUsers[1]) {
        const membershipValues = [
          {
            userId: createdUsers[0].id,
            tenantId: sampleTenant.id,
            roleId: adminRole.id,
            status: 'active' as const,
          },
          {
            userId: createdUsers[1].id,
            tenantId: sampleTenant.id,
            roleId: memberRole.id,
            status: 'active' as const,
          },
        ];

        await db
          .insert(memberships)
          .values(membershipValues)
          .onConflictDoNothing();

        logger.info(`Created ${createdUsers.length} sample users with memberships`);
      }

      // 9. Create sample audit logs
      logger.info('Creating sample audit logs...');
      const auditLogValues = [
        {
          tenantId: sampleTenant.id,
          actorUserId: superuser?.id,
          action: 'tenant.create',
          resource: 'tenant',
          resourceId: sampleTenant.id,
          metadata: { name: sampleTenant.name },
        },
        {
          tenantId: sampleTenant.id,
          actorUserId: superuser?.id,
          action: 'user.invite',
          resource: 'user',
          resourceId: createdUsers[0]?.id,
          metadata: { email: 'admin@acme.com', role: 'Admin' },
        },
        {
          tenantId: sampleTenant.id,
          actorUserId: superuser?.id,
          action: 'role.create',
          resource: 'role',
          resourceId: ownerRole?.id,
          metadata: { roleName: DEFAULT_ROLES.OWNER },
        },
      ].filter(log => log.actorUserId && log.resourceId);

      if (auditLogValues.length > 0) {
        await db.insert(auditLogs).values(auditLogValues);
        logger.info(`Created ${auditLogValues.length} sample audit logs`);
      }
    } else {
      logger.info('Sample tenant already exists');
    }

    logger.info('Database seeding completed successfully!');
    logger.info('');
    logger.info('🎉 Setup complete! You can now:');
    logger.info(`   • Login as superuser: ${env.SUPERUSER_EMAIL} / superuser123!`);
    logger.info(`   • Login as admin: admin@acme.com / admin123!`);
    logger.info(`   • Login as member: member@acme.com / member123!`);
    logger.info(`   • Access tenant: http://localhost:5000/acme-corp/dashboard`);
    logger.info('');

  } catch (error) {
    logger.error('Database seeding failed:', error);
    throw error;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase().catch((error) => {
    logger.error('Seed script failed:', error);
    process.exit(1);
  });
}
