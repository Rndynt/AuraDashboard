# Dashboard Starter Kit

## Overview

This is a sophisticated multi-tenant Dashboard Starter Kit built with Next.js, implementing Domain-Driven Design (DDD) architecture with strict modular separation. The system provides enterprise-grade features including multi-tenant data isolation through PostgreSQL Row Level Security (RLS), dynamic Role-Based Access Control (RBAC), and comprehensive authentication using better-auth. 

The project follows a modular monolith approach where each business domain (identity, tenancy, authorization, dashboard, audit) is encapsulated in separate modules with clear DDD layering (domain/application/infrastructure/interface). The architecture emphasizes security-first design with automatic tenant isolation, dynamic permission management, and comprehensive audit logging.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Monorepo Structure
The project uses a pnpm monorepo with Turborepo for build orchestration. The structure separates concerns into `apps/` (deployable applications), `packages/` (shared libraries), and `modules/` (business domains). The Next.js web application serves as the primary interface while shared packages handle cross-cutting concerns like database connections, authentication, and UI components.

### Authentication & Session Management
The system uses better-auth for modern authentication with email/password flows, session management via httpOnly cookies, and refresh token rotation. Authentication is integrated with the multi-tenant system where users can belong to multiple tenants with different roles in each. The middleware automatically resolves tenant context from URL paths and sets request context for downstream services.

### Multi-Tenant Architecture
Multi-tenancy is achieved through PostgreSQL Row Level Security (RLS) with tenant-scoped data isolation. Each request sets the tenant context using `SET LOCAL app.tenant_id` in database transactions, and RLS policies automatically filter all queries to the appropriate tenant. Superusers can switch tenant contexts but never bypass RLS policies, ensuring consistent security enforcement.

### Domain-Driven Design Implementation
Each business domain follows strict DDD layering:
- **Domain Layer**: Pure business logic with entities and value objects
- **Application Layer**: Use cases and application services that orchestrate business logic
- **Infrastructure Layer**: Database repositories, external service adapters
- **Interface Layer**: HTTP routes, UI components, API endpoints

Dependencies flow inward (interface → infrastructure → application → domain) with no reverse dependencies.

### Role-Based Access Control
The RBAC system uses dynamic permission keys stored in the database rather than hardcoded roles. Permissions follow a `resource.action` pattern (e.g., `member.invite`, `tenant.update`). Role templates are materialized on tenant creation, and permission checks are performed both server-side and client-side for UI rendering. Superusers inherit all permissions across all tenants they can access.

### Database Strategy
The system uses a single PostgreSQL database with Drizzle ORM for type-safe database operations. All tenant-scoped tables have RLS enabled with policies that filter based on the session-level `app.tenant_id` setting. Migrations are managed through Drizzle Kit, and the database includes comprehensive indexes for tenant-based queries.

## External Dependencies

### Database & Storage
- **PostgreSQL**: Primary database with Row Level Security for multi-tenant isolation
- **Drizzle ORM**: Type-safe database operations with migration management
- **Neon Database Serverless**: Serverless PostgreSQL connection pooling

### Authentication
- **better-auth**: Modern authentication library with session management
- **bcrypt**: Password hashing for security
- **Zod**: Schema validation for input sanitization

### Frontend Framework
- **Next.js 14**: React framework with App Router for file-based routing
- **React Hook Form**: Form state management with validation
- **TanStack Query**: Server state management and caching
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: Component library built on Radix UI primitives

### Observability & Monitoring
- **Pino**: Structured logging with performance optimization
- **OpenTelemetry**: Distributed tracing and metrics (configured for production)
- **Sentry**: Error tracking and performance monitoring (optional)

### Development Tools
- **TypeScript**: Static type checking across the entire stack
- **ESLint & Prettier**: Code linting and formatting
- **Turborepo**: Monorepo build system with caching
- **Drizzle Kit**: Database migration and introspection tools