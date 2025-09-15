# RLS Checklist

## Preparation
- [x] All tenant data tables have `tenant_id UUID NOT NULL` + composite indexes
- [x] App DB role does NOT have BYPASSRLS
- [x] Transaction helper implemented for `SET LOCAL app.tenant_id`

## Activation
- [x] RLS ENABLED on all tenant-scoped tables:
  - [x] memberships
  - [x] invitations
  - [x] api_keys
  - [x] audit_logs
- [x] Policies implemented:
  - [x] SELECT policy uses `current_setting('app.tenant_id')::uuid`
  - [x] WRITE policy (INSERT/UPDATE/DELETE) uses WITH CHECK with same expression
- [x] Transaction helper sets `SET LOCAL app.tenant_id = <tenant>` per request

## App Guards
- [x] Middleware resolves tenant from URL path
- [x] AsyncLocalStorage sets `ctx.tenantId` for request context
- [x] Repository layer never accepts tenant_id from client input
- [x] Superuser does NOT bypass RLS; uses tenant switch to assume context
- [x] All API routes run within tenant-scoped transactions

## Testing Coverage
- [ ] Cross-tenant access denial tests for each RLS-enabled table
- [ ] Write rejection tests when `tenant_id` mismatched
- [ ] Superuser context switching tests
- [ ] Transaction rollback tests for RLS violations

## Audit & Monitoring
- [x] Audit logs record `tenant_id`, `actor_user_id`, action, resource_id
- [ ] Alerts configured for queries executed without `app.tenant_id` set
- [ ] Monitoring dashboard for RLS policy violations
- [ ] Regular review of RLS policy effectiveness

## Tables with RLS Protection

| Table | tenant_id Column | RLS Enabled | Policies | Index |
|-------|------------------|-------------|----------|-------|
| memberships | ✅ tenant_id | ✅ | SELECT + WRITE | ✅ |
| invitations | ✅ tenant_id | ✅ | SELECT + WRITE | ✅ |
| api_keys | ✅ tenant_id | ✅ | SELECT + WRITE | ✅ |
| audit_logs | ✅ tenant_id | ✅ | SELECT + WRITE | ✅ |

## Non-Tenant Tables (No RLS)

| Table | Reason | Access Control |
|-------|--------|----------------|
| tenants | Global tenant registry | Application-level filtering |
| users | Global user registry | Application-level filtering |
| roles | Global + tenant-specific | Application-level filtering |
| permissions | Global permission registry | Read-only |
| role_permissions | Global + tenant-specific | Application-level filtering |
| sessions | User-scoped, not tenant-scoped | User ID filtering |

## RLS Policy Verification

Run these queries to verify RLS is working correctly:

```sql
-- Test 1: Verify RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('memberships', 'invitations', 'api_keys', 'audit_logs');

-- Test 2: Verify policies exist
SELECT schemaname, tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('memberships', 'invitations', 'api_keys', 'audit_logs');

-- Test 3: Test tenant isolation (should return empty when wrong tenant_id is set)
SET app.tenant_id = '00000000-0000-0000-0000-000000000000';
SELECT COUNT(*) FROM memberships; -- Should be 0 if no data for this tenant

-- Test 4: Test with correct tenant_id (should return data)
SET app.tenant_id = 'actual-tenant-uuid-here';
SELECT COUNT(*) FROM memberships; -- Should return actual count
