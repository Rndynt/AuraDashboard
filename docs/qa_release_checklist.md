# QA Release Checklist

## Pre-Release Environment Setup
- [ ] All environment variables documented and present (.env.example)
- [ ] Database connection successful (check DATABASE_URL)
- [ ] Redis connection working (for rate limiting)
- [ ] All secrets properly configured (BETTER_AUTH_SECRET, SESSION_SECRET)
- [ ] SUPERUSER_EMAIL and SUPERUSER_NAME set correctly

## Installation & Setup
- [ ] `pnpm install` runs without errors
- [ ] `pnpm migrate:push` applies migrations successfully
- [ ] `pnpm seed` creates initial data without errors
- [ ] `pnpm dev` starts development server on port 5000
- [ ] `pnpm build` completes without TypeScript or build errors
- [ ] `pnpm lint` passes all linting rules
- [ ] `pnpm typecheck` passes strict TypeScript validation

## Authentication Flow
- [ ] Registration form works with email/password
- [ ] Login form authenticates existing users
- [ ] Form validation shows appropriate error messages
- [ ] Password strength requirements enforced
- [ ] Successful auth redirects to dashboard
- [ ] Logout functionality clears session
- [ ] Session persistence across browser refresh
- [ ] Brute-force protection triggers after failed attempts

## Multi-Tenant Access Control
- [ ] Superuser can switch tenants via UI
- [ ] Superuser can access all tenant resources
- [ ] Non-superuser cannot access other tenants' data
- [ ] Tenant context properly isolated in database queries
- [ ] URL-based tenant resolution works (`/[tenant]/dashboard`)
- [ ] Middleware sets correct tenant context
- [ ] RLS policies enforce data isolation

## RBAC System
- [ ] Permission-based menu hiding works correctly
- [ ] Server-side permission checks block unauthorized actions
- [ ] Admin users can access admin features
- [ ] Member users have restricted access
- [ ] Viewer users have read-only access
- [ ] Owner users have full tenant control
- [ ] Permission matrix matches documented CSV

## Dashboard Functionality
- [ ] Dashboard overview displays correct stats
- [ ] Recent activity feed shows tenant-scoped events
- [ ] Onboarding checklist reflects actual completion status
- [ ] Quick actions respect user permissions
- [ ] Stats cards show real data from database
- [ ] Progress indicators work correctly

## Team Management
- [ ] Members page lists tenant users only
- [ ] Invite member functionality works (for authorized users)
- [ ] Role assignments can be changed (by authorized users)
- [ ] Member status updates reflect in UI
- [ ] Search and filtering work correctly
- [ ] Pagination handles large member lists

## Roles & Permissions
- [ ] Roles page displays all available roles
- [ ] Permission matrix shows correct role-permission mappings
- [ ] Global roles vs tenant-specific roles properly distinguished
- [ ] Role descriptions are clear and accurate
- [ ] Permission categories logically organized

## API Keys Management
- [ ] API keys page shows tenant-specific keys only
- [ ] Key creation works (for authorized users)
- [ ] Key revocation works (for authorized users)
- [ ] Key metadata (scopes, last used) displays correctly
- [ ] Security warnings are prominently displayed

## Audit Logging
- [ ] Audit logs page shows tenant-scoped events only
- [ ] Filtering by action, resource, date works
- [ ] Search functionality works across log entries
- [ ] Pagination handles large log volumes
- [ ] Log details contain sufficient information
- [ ] Export functionality works (if implemented)

## Tenant Settings
- [ ] Settings page loads without errors
- [ ] Tenant information can be updated (by authorized users)
- [ ] Domain configuration works
- [ ] Security settings are functional
- [ ] Dashboard preferences save correctly
- [ ] Danger zone operations require confirmation

## Security Verification
- [ ] Security headers present in HTTP responses
  - [ ] Content-Security-Policy with nonce
  - [ ] Strict-Transport-Security
  - [ ] X-Frame-Options: DENY
  - [ ] X-Content-Type-Options: nosniff
  - [ ] Referrer-Policy: strict-origin-when-cross-origin
- [ ] Rate limiting triggers on abusive patterns
- [ ] CSRF protection working via SameSite cookies
- [ ] No sensitive data in browser DevTools/Network tab
- [ ] No console errors related to security

## RLS Testing (Critical)
- [ ] User A in tenant X cannot read data from tenant Y (all tables)
- [ ] User A in tenant X cannot write data to tenant Y (all tables)
- [ ] Cross-tenant queries return empty results
- [ ] Direct database queries respect RLS policies
- [ ] Superuser context switching maintains RLS enforcement
- [ ] Transaction-level tenant context is set correctly

## Performance & Reliability
- [ ] Page load times acceptable (< 2s for dashboard)
- [ ] Database queries use appropriate indexes
- [ ] No N+1 query problems in lists
- [ ] Memory usage stable during normal operations
- [ ] Error boundaries catch and display errors gracefully
- [ ] Loading states provide user feedback

## Browser Compatibility
- [ ] Works in Chrome (latest)
- [ ] Works in Firefox (latest)
- [ ] Works in Safari (latest)
- [ ] Works in Edge (latest)
- [ ] Mobile responsiveness verified
- [ ] Dark mode toggle works correctly

## Data Integrity
- [ ] Database foreign key constraints enforced
- [ ] Data validation prevents invalid states
- [ ] Soft deletes preserve referential integrity
- [ ] Audit trail captures all important changes
- [ ] Timestamps are accurate and consistent

## Observability
- [ ] Application logs contain structured information
- [ ] No sensitive data (passwords, tokens) in logs
- [ ] Telemetry & Sentry receiving events
- [ ] Health check endpoints return correct status
- [ ] Error tracking captures uncaught exceptions

## Documentation Sync
- [ ] ADRs up-to-date with current implementation
- [ ] Features checklist reflects actual features
- [ ] Permission matrix CSV matches database
- [ ] `pnpm docs:sync` runs without drift detection
- [ ] README instructions work for new developers

## API Testing
- [ ] All API endpoints require proper authentication
- [ ] API endpoints respect RBAC permissions
- [ ] Input validation rejects malformed requests
- [ ] Error responses are consistent and informative
- [ ] Rate limiting applies to API endpoints
- [ ] CORS policy correctly configured

## Edge Cases
- [ ] Empty states display appropriate messages
- [ ] Error states provide actionable guidance
- [ ] Network failures handled gracefully
- [ ] Invalid tenant URLs redirect appropriately
- [ ] Expired sessions redirect to login
- [ ] Concurrent user sessions work correctly

## Final Verification
- [ ] All environment variables used in production are documented
- [ ] No hardcoded values in source code
- [ ] All secrets properly externalized
- [ ] Database migrations are reversible
- [ ] Backup and recovery procedures documented
- [ ] Security incident response plan ready

## Performance Benchmarks
- [ ] Dashboard loads in < 2 seconds
- [ ] Member list loads in < 1 second for 100 users
- [ ] Audit logs load in < 3 seconds for 1000 entries
- [ ] Database query times < 100ms for common operations
- [ ] Memory usage < 512MB under normal load

## Deployment Readiness
- [ ] Build artifacts created successfully
- [ ] Environment-specific configurations verified
- [ ] Health checks pass in staging environment
- [ ] Database connection pooling configured
- [ ] Log aggregation working
- [ ] Monitoring alerts configured

## Sign-off
- [ ] Technical lead approval
- [ ] Security review completed
- [ ] Performance testing passed
- [ ] Documentation review completed
- [ ] Stakeholder acceptance obtained

## Notes
- Any failed checklist item must be addressed before release
- Security-related failures are release blockers
- Performance regressions require investigation
- Documentation gaps must be filled
- All team members should verify their areas of responsibility
