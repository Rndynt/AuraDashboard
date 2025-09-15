import { db } from './connection';
import { 
  tenants, 
  users, 
  roles, 
  permissions, 
  rolePermissions, 
  memberships,
  auditLogs 
} from './schema';
import { env, logger } from '@acme/core';
import { PERMISSIONS, DEFAULT_ROLES, ROLE_PERMISSIONS } from '@acme/rbac';
import bcrypt from 'bcrypt';

async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 12);
}

export async function seedDatabase() {
  logger.info('Starting database seeding...');

  try {
    // 1. Create superuser
    logger.info('Creating superuser...');
    const [superuser] = await db
      .insert(users)
      .values({
        email: env.SUPERUSER_EMAIL,
        name: env.SUPERUSER_NAME,
        passwordHash: await hashPassword('superuser123!'),
        isSuperuser: true,
        emailVerified: true,
      })
      .onConflictDoNothing()
      .returning();

    if (superuser) {
      logger.info(`Superuser created: ${superuser.email}`);
    } else {
      logger.info('Superuser already exists');
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
    const allRoles = await db.select().from(roles).where(roles.tenantId === null);

    const permissionMap = new Map(allPermissions.map(p => [p.key, p.id]));
    const roleMap = new Map(allRoles.map(r => [r.name, r.id]));

    const rolePermissionValues = [];
    
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

    // 5. Create sample tenant
    logger.info('Creating sample tenant...');
    const [sampleTenant] = await db
      .insert(tenants)
      .values({
        slug: 'acme-corp',
        name: 'Acme Corporation',
        status: 'active',
      })
      .onConflictDoNothing()
      .returning();

    if (sampleTenant) {
      logger.info(`Sample tenant created: ${sampleTenant.slug}`);

      // 6. Materialize roles for the sample tenant
      logger.info('Materializing roles for sample tenant...');
      const tenantRoles = roleValues.map(role => ({
        ...role,
        tenantId: sampleTenant.id,
      }));

      const materializedRoles = await db
        .insert(roles)
        .values(tenantRoles)
        .returning();

      // Copy role-permission mappings for tenant-specific roles
      const materializedRoleMap = new Map(materializedRoles.map(r => [r.name, r.id]));
      const tenantRolePermissionValues = [];

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

      await db
        .insert(rolePermissions)
        .values(tenantRolePermissionValues)
        .onConflictDoNothing();

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

      // 8. Create sample users
      logger.info('Creating sample users...');
      const sampleUsers = [
        {
          email: 'admin@acme.com',
          name: 'Admin User',
          passwordHash: await hashPassword('admin123!'),
          emailVerified: true,
        },
        {
          email: 'member@acme.com',
          name: 'Member User',
          passwordHash: await hashPassword('member123!'),
          emailVerified: true,
        },
      ];

      const createdUsers = await db
        .insert(users)
        .values(sampleUsers)
        .onConflictDoNothing()
        .returning();

      // Create memberships for sample users
      const adminRole = materializedRoles.find(r => r.name === DEFAULT_ROLES.ADMIN);
      const memberRole = materializedRoles.find(r => r.name === DEFAULT_ROLES.MEMBER);

      if (createdUsers.length > 0 && adminRole && memberRole) {
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
