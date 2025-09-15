-- Enable Row Level Security for multi-tenant isolation
-- This migration creates the core schema with RLS policies

-- Create tenants table
CREATE TABLE tenants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create users table
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  password_hash TEXT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  is_superuser BOOLEAN NOT NULL DEFAULT FALSE,
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create roles table (tenant_id NULL for global default roles)
CREATE TABLE roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create permissions table
CREATE TABLE permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key VARCHAR(100) NOT NULL UNIQUE,
  description TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create role_permissions junction table
CREATE TABLE role_permissions (
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- Create memberships table (tenant-scoped)
CREATE TABLE memberships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id),
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, tenant_id)
);

-- Create invitations table (tenant-scoped)
CREATE TABLE invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role_id UUID NOT NULL REFERENCES roles(id),
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  invited_by UUID NOT NULL REFERENCES users(id),
  accepted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create api_keys table (tenant-scoped)
CREATE TABLE api_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  key_hash TEXT NOT NULL,
  scopes JSONB NOT NULL DEFAULT '[]',
  last_used_at TIMESTAMP,
  expires_at TIMESTAMP,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create sessions table
CREATE TABLE sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  user_agent TEXT,
  ip_address VARCHAR(45),
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create audit_logs table (tenant-scoped)
CREATE TABLE audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  actor_user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  resource VARCHAR(100) NOT NULL,
  resource_id UUID,
  metadata JSONB DEFAULT '{}',
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create indexes for performance
CREATE INDEX tenants_slug_idx ON tenants(slug);
CREATE INDEX users_email_idx ON users(email);
CREATE INDEX memberships_user_tenant_idx ON memberships(user_id, tenant_id);
CREATE INDEX memberships_tenant_idx ON memberships(tenant_id);
CREATE INDEX roles_tenant_idx ON roles(tenant_id);
CREATE INDEX role_permissions_role_idx ON role_permissions(role_id);
CREATE INDEX invitations_tenant_idx ON invitations(tenant_id);
CREATE INDEX invitations_token_idx ON invitations(token);
CREATE INDEX api_keys_tenant_idx ON api_keys(tenant_id);
CREATE INDEX sessions_user_idx ON sessions(user_id);
CREATE INDEX sessions_token_idx ON sessions(token);
CREATE INDEX audit_logs_tenant_idx ON audit_logs(tenant_id);
CREATE INDEX audit_logs_actor_idx ON audit_logs(actor_user_id);
CREATE INDEX audit_logs_resource_idx ON audit_logs(resource, resource_id);
CREATE INDEX audit_logs_created_at_idx ON audit_logs(created_at);

-- Enable Row Level Security on tenant-scoped tables
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for memberships
CREATE POLICY memberships_isolation_select
  ON memberships FOR SELECT
  USING (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY memberships_isolation_write
  ON memberships FOR ALL
  USING (tenant_id = current_setting('app.tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);

-- Create RLS policies for invitations
CREATE POLICY invitations_isolation_select
  ON invitations FOR SELECT
  USING (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY invitations_isolation_write
  ON invitations FOR ALL
  USING (tenant_id = current_setting('app.tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);

-- Create RLS policies for api_keys
CREATE POLICY api_keys_isolation_select
  ON api_keys FOR SELECT
  USING (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY api_keys_isolation_write
  ON api_keys FOR ALL
  USING (tenant_id = current_setting('app.tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);

-- Create RLS policies for audit_logs
CREATE POLICY audit_logs_isolation_select
  ON audit_logs FOR SELECT
  USING (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY audit_logs_isolation_write
  ON audit_logs FOR ALL
  USING (tenant_id = current_setting('app.tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);

-- Insert default permissions
INSERT INTO permissions (key, description) VALUES
  ('tenant.create', 'Create tenant'),
  ('tenant.update', 'Update tenant'),
  ('tenant.delete', 'Delete tenant'),
  ('member.invite', 'Invite member'),
  ('member.manage', 'Add/Remove/Change roles'),
  ('member.view', 'View members'),
  ('role.view', 'View roles/permissions'),
  ('role.manage', 'Create/Update roles'),
  ('audit.view', 'View audit logs'),
  ('apikey.create', 'Create API keys'),
  ('apikey.view', 'View API keys'),
  ('apikey.revoke', 'Revoke API keys'),
  ('profile.view', 'View own profile'),
  ('profile.update', 'Update own profile'),
  ('dashboard.view', 'View dashboard module'),
  ('dashboard.settings.update', 'Update dashboard settings');

-- Insert default global roles (tenant_id = NULL)
INSERT INTO roles (tenant_id, name, description) VALUES
  (NULL, 'Owner', 'Full access to all tenant resources'),
  (NULL, 'Admin', 'Administrative access with most permissions'),
  (NULL, 'Member', 'Standard member access'),
  (NULL, 'Viewer', 'Read-only access');

-- Insert role-permission mappings for default roles
WITH role_perms AS (
  SELECT 
    r.id as role_id,
    p.id as permission_id
  FROM roles r
  CROSS JOIN permissions p
  WHERE r.tenant_id IS NULL
    AND (
      (r.name = 'Owner') OR
      (r.name = 'Admin' AND p.key IN (
        'tenant.update', 'member.invite', 'member.manage', 'member.view', 
        'role.view', 'audit.view', 'apikey.create', 'apikey.view', 
        'apikey.revoke', 'profile.view', 'profile.update', 'dashboard.view', 
        'dashboard.settings.update'
      )) OR
      (r.name = 'Member' AND p.key IN (
        'member.view', 'profile.view', 'profile.update', 'dashboard.view'
      )) OR
      (r.name = 'Viewer' AND p.key IN (
        'member.view', 'profile.view', 'profile.update', 'dashboard.view'
      ))
    )
)
INSERT INTO role_permissions (role_id, permission_id)
SELECT role_id, permission_id FROM role_perms;
