# ADR-004: Permission-Based RBAC with Dynamic Keys

**Date:** 2024-01-15  
**Status:** Accepted  
**Deciders:** Security Team, Architecture Team  
**Technical Story:** Authorization and access control system design

## Context

The Dashboard Starter Kit requires a sophisticated authorization system that can handle:

1. **Multi-Tenant Isolation**: Users in different tenants should have different permissions
2. **Dynamic Permissions**: Permission sets should be configurable, not hardcoded
3. **Granular Control**: Fine-grained permissions for different resources and actions
4. **Role Management**: Ability to create and modify roles with different permission sets
5. **Hierarchical Access**: Some users (superusers) need cross-tenant access
6. **Performance**: Authorization checks shouldn't significantly impact response times
7. **Auditability**: All permission changes and checks should be auditable
8. **Developer Experience**: Easy to use in both server and client code

We need to choose an RBAC (Role-Based Access Control) approach that balances flexibility, security, and performance.

## Decision

We will implement **permission-based RBAC** using **dynamic permission keys** stored in the database.

### Core Concepts:
- **Permission Keys**: String-based permissions like `resource.action` (e.g., `member.invite`)
- **Roles**: Named collections of permissions (e.g., `Owner`, `Admin`, `Member`)
- **Dynamic Assignment**: Permissions are stored in database, not hardcoded
- **Tenant-Scoped**: Roles and memberships are scoped to specific tenants
- **Superuser Override**: Superusers bypass all permission checks but maintain context

### Permission Key Structure:
