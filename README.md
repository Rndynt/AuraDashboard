# Dashboard Starter Kit

A sophisticated multi-tenant Dashboard Starter Kit with strict DDD architecture, PostgreSQL RLS, RBAC, and better-auth integration.

## Features

- 🏗️ **Modular Monolith with DDD**: Clean architecture with domain-driven design
- 🔐 **Multi-Tenant Security**: PostgreSQL Row Level Security for data isolation
- 👥 **Advanced RBAC**: Dynamic role-based access control with permissions
- 🔑 **Better-Auth Integration**: Modern authentication with session management
- 📊 **Enterprise Dashboard**: Complete admin interface with audit logging
- 🚀 **Production Ready**: Security headers, rate limiting, observability
- 📱 **Responsive UI**: Modern design with dark mode support
- 🧪 **Comprehensive Testing**: Unit, integration, and E2E test coverage

## Quick Start

1. **Install dependencies**
   ```bash
   pnpm install
   ```

2. **Setup environment**
   ```bash
   cp .env.example .env
   # Fill in your database and auth configuration
   ```

3. **Setup database**
   ```bash
   pnpm migrate:push
   pnpm seed
   ```

4. **Start development**
   ```bash
   pnpm dev
   ```

5. **Access the application**
   - Visit http://localhost:5000
   - Create an account or sign in
   - Explore the dashboard features

## Architecture

### Monorepo Structure
- `apps/web` - Next.js application with App Router
- `packages/core` - Shared utilities and types
- `packages/db` - Database schema and migrations
- `packages/auth` - Better-auth integration
- `packages/rbac` - Role-based access control
- `packages/ui` - Shared components
- `packages/modules/*` - DDD business modules

### Key Technologies
- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Node.js, PostgreSQL, Drizzle ORM
- **Auth**: Better-auth with session management
- **Security**: RLS, CSP, HSTS, rate limiting
- **Tooling**: pnpm, Turborepo, ESLint, TypeScript

## Security Features

### Multi-Tenant Isolation
- PostgreSQL Row Level Security (RLS) on all tenant data
- Transaction-level tenant context with `SET LOCAL app.tenant_id`
- Zero hardcoded tenant bypasses

### Role-Based Access Control
- Dynamic permission system stored in database
- Server-side and client-side permission guards
- Superuser mode with tenant context switching

### Security Headers
- Content Security Policy (CSP) with nonce
- HTTP Strict Transport Security (HSTS)
- X-Frame-Options, X-Content-Type-Options
- Referrer Policy controls

## Documentation

- [Architecture Overview](./docs/architecture_overview.md)
- [RLS Checklist](./docs/rls_checklist.md)
- [Security Checklist](./docs/security_checklist.md)
- [Features Checklist](./docs/features_checklist.md)
- [QA Release Checklist](./docs/qa_release_checklist.md)
- [Permission Matrix](./docs/permission_matrix.csv)

## Development

### Available Scripts
- `pnpm dev` - Start development servers
- `pnpm build` - Build for production
- `pnpm test` - Run all tests
- `pnpm lint` - Lint codebase
- `pnpm typecheck` - TypeScript type checking
- `pnpm migrate:push` - Apply database migrations
- `pnpm seed` - Seed database with initial data

### Creating New Modules

Use the DDD module structure:

