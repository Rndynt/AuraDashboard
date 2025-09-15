import { sql } from 'drizzle-orm';
import { 
  pgTable, 
  uuid, 
  text, 
  varchar, 
  timestamp, 
  boolean, 
  jsonb,
  index,
  primaryKey,
  unique
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

// Core tables - ordered to resolve forward references
export const tenants = pgTable('tenants', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  status: varchar('status', { length: 50 }).notNull().default('active'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  slugIdx: index('tenants_slug_idx').on(table.slug),
}));

// Better-auth compatible user table
export const user = pgTable('user', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  email: varchar('email', { length: 255 }).unique(),
  name: varchar('name', { length: 255 }),
  emailVerified: boolean('emailVerified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
  // Additional fields for multi-tenant system
  status: varchar('status', { length: 50 }).notNull().default('active'),
  isSuperuser: boolean('is_superuser').notNull().default(false),
}, (table) => ({
  emailIdx: index('user_email_idx').on(table.email),
}));

// Keep backward compatibility alias
export const users = user;

export const permissions = pgTable('permissions', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  key: varchar('key', { length: 100 }).notNull().unique(),
  description: text('description').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Better-auth compatible verification table
export const verification = pgTable('verification', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expiresAt').notNull(),
  createdAt: timestamp('createdAt'),
  updatedAt: timestamp('updatedAt'),
}, (table) => ({
  identifierIdx: index('verification_identifier_idx').on(table.identifier),
}));

// Keep backward compatibility alias
export const verifications = verification;

export const roles = pgTable('roles', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }), // NULL for global roles
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index('roles_tenant_idx').on(table.tenantId),
}));

// Better-auth compatible session table
export const session = pgTable('session', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  expiresAt: timestamp('expiresAt').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
  ipAddress: varchar('ipAddress', { length: 45 }),
  userAgent: text('userAgent'),
  userId: uuid('userId').notNull().references(() => user.id, { onDelete: 'cascade' }),
}, (table) => ({
  userIdx: index('session_user_idx').on(table.userId),
  tokenIdx: index('session_token_idx').on(table.token),
}));

// Keep backward compatibility alias
export const sessions = session;

// Better-auth compatible account table
export const account = pgTable('account', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  accountId: text('accountId').notNull(),
  providerId: text('providerId').notNull(),
  userId: uuid('userId').notNull().references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('accessToken'),
  refreshToken: text('refreshToken'),
  idToken: text('idToken'),
  accessTokenExpiresAt: timestamp('accessTokenExpiresAt'),
  refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
}, (table) => ({
  userIdx: index('account_user_idx').on(table.userId),
}));

// Keep backward compatibility alias
export const accounts = account;

export const memberships = pgTable('memberships', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  userId: uuid('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  roleId: uuid('role_id').notNull().references(() => roles.id),
  status: varchar('status', { length: 50 }).notNull().default('active'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userTenantIdx: index('memberships_user_tenant_idx').on(table.userId, table.tenantId),
  tenantIdx: index('memberships_tenant_idx').on(table.tenantId),
  uniqueUserTenant: unique('unique_user_tenant').on(table.userId, table.tenantId),
}));

export const rolePermissions = pgTable('role_permissions', {
  roleId: uuid('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
  permissionId: uuid('permission_id').notNull().references(() => permissions.id, { onDelete: 'cascade' }),
}, (table) => ({
  pk: primaryKey({ columns: [table.roleId, table.permissionId] }),
  roleIdx: index('role_permissions_role_idx').on(table.roleId),
}));

export const invitations = pgTable('invitations', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  email: varchar('email', { length: 255 }).notNull(),
  roleId: uuid('role_id').notNull().references(() => roles.id),
  token: varchar('token', { length: 255 }).notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  invitedBy: uuid('invited_by').notNull().references(() => user.id),
  acceptedAt: timestamp('accepted_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index('invitations_tenant_idx').on(table.tenantId),
  tokenIdx: index('invitations_token_idx').on(table.token),
}));

export const apiKeys = pgTable('api_keys', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  keyHash: text('key_hash').notNull(),
  scopes: jsonb('scopes').notNull().default('[]'),
  lastUsedAt: timestamp('last_used_at'),
  expiresAt: timestamp('expires_at'),
  createdBy: uuid('created_by').notNull().references(() => user.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index('api_keys_tenant_idx').on(table.tenantId),
}));

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }),
  actorUserId: uuid('actor_user_id').references(() => user.id),
  action: varchar('action', { length: 100 }).notNull(),
  resource: varchar('resource', { length: 100 }).notNull(),
  resourceId: uuid('resource_id'),
  metadata: jsonb('metadata').default('{}'),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index('audit_logs_tenant_idx').on(table.tenantId),
  actorIdx: index('audit_logs_actor_idx').on(table.actorUserId),
  resourceIdx: index('audit_logs_resource_idx').on(table.resource, table.resourceId),
  createdAtIdx: index('audit_logs_created_at_idx').on(table.createdAt),
}));

// Relations
export const tenantsRelations = relations(tenants, ({ many }) => ({
  memberships: many(memberships),
  roles: many(roles),
  invitations: many(invitations),
  apiKeys: many(apiKeys),
}));

export const userRelations = relations(user, ({ many }) => ({
  memberships: many(memberships),
  invitationsSent: many(invitations),
  apiKeysCreated: many(apiKeys),
  sessions: many(session),
  accounts: many(account),
}));

// Keep backward compatibility alias
export const usersRelations = userRelations;

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

// Keep backward compatibility alias
export const accountsRelations = accountRelations;

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

// Keep backward compatibility alias
export const sessionsRelations = sessionRelations;

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  tenant: one(tenants, {
    fields: [auditLogs.tenantId],
    references: [tenants.id],
  }),
  actor: one(user, {
    fields: [auditLogs.actorUserId],
    references: [user.id],
  }),
}));

export const membershipsRelations = relations(memberships, ({ one }) => ({
  user: one(user, {
    fields: [memberships.userId],
    references: [user.id],
  }),
  tenant: one(tenants, {
    fields: [memberships.tenantId],
    references: [tenants.id],
  }),
  role: one(roles, {
    fields: [memberships.roleId],
    references: [roles.id],
  }),
}));

export const rolesRelations = relations(roles, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [roles.tenantId],
    references: [tenants.id],
  }),
  memberships: many(memberships),
  rolePermissions: many(rolePermissions),
  invitations: many(invitations),
}));

export const permissionsRelations = relations(permissions, ({ many }) => ({
  rolePermissions: many(rolePermissions),
}));

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  role: one(roles, {
    fields: [rolePermissions.roleId],
    references: [roles.id],
  }),
  permission: one(permissions, {
    fields: [rolePermissions.permissionId],
    references: [permissions.id],
  }),
}));

// Zod schemas
export const insertTenantSchema = createInsertSchema(tenants).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserSchema = createInsertSchema(user).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  emailVerified: true,
}).extend({
  password: z.string().min(8).optional(),
});

export const insertMembershipSchema = createInsertSchema(memberships).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRoleSchema = createInsertSchema(roles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPermissionSchema = createInsertSchema(permissions).omit({
  id: true,
  createdAt: true,
});

export const insertInvitationSchema = createInsertSchema(invitations).omit({
  id: true,
  token: true,
  acceptedAt: true,
  createdAt: true,
});

export const insertApiKeySchema = createInsertSchema(apiKeys).omit({
  id: true,
  keyHash: true,
  lastUsedAt: true,
  createdAt: true,
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  createdAt: true,
});

// Types - Better-auth compatible
export type User = typeof user.$inferSelect;
export type Session = typeof session.$inferSelect;
export type Account = typeof account.$inferSelect;
export type Verification = typeof verification.$inferSelect;

// Additional types for multi-tenant system
export type Tenant = typeof tenants.$inferSelect;
export type Membership = typeof memberships.$inferSelect;
export type Role = typeof roles.$inferSelect;
export type Permission = typeof permissions.$inferSelect;
export type RolePermission = typeof rolePermissions.$inferSelect;
export type Invitation = typeof invitations.$inferSelect;
export type ApiKey = typeof apiKeys.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;

// Insert types
export type InsertTenant = z.infer<typeof insertTenantSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertMembership = z.infer<typeof insertMembershipSchema>;
export type InsertRole = z.infer<typeof insertRoleSchema>;
export type InsertPermission = z.infer<typeof insertPermissionSchema>;
export type InsertInvitation = z.infer<typeof insertInvitationSchema>;
export type InsertApiKey = z.infer<typeof insertApiKeySchema>;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
