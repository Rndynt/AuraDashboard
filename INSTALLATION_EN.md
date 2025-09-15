# Dashboard Starter Kit Installation Guide

Complete installation guide for setting up and running the Dashboard Starter Kit after cloning from repository.

## 📋 Prerequisites

Make sure your system has:

### Required Software
- **Node.js** version 18 or newer
- **pnpm** as package manager (recommended)
  ```bash
  npm install -g pnpm
  ```

### Database
- **PostgreSQL** database (local or cloud like Neon, Supabase, etc.)

## 🚀 Installation Steps

### 1. Clone Repository
```bash
git clone <repository-url>
cd dashboard-starter-kit
```

### 2. Install Dependencies
```bash
# Install all dependencies for the monorepo
pnpm install
```

> **Note**: If you see warnings about build scripts, run `pnpm approve-builds` if needed.

### 3. Setup Environment Variables

Create `.env.local` file in the project root:

```bash
cp .env.example .env.local
```

Edit `.env.local` and fill with your database configuration:

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@host:port/database_name"

# Auth Configuration (optional for development)
AUTH_SECRET="your-auth-secret-key"
AUTH_URL="http://localhost:5000"

# Other environment variables
NODE_ENV="development"
```

### 4. Database Setup

#### For Replit Environment
PostgreSQL database is automatically available with environment variables:
- `DATABASE_URL`
- `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`, `PGHOST`

#### For Local Environment
Make sure PostgreSQL is running and database is created.

#### Push Schema to Database
```bash
# Push schema to database
npm run db:push

# If there's a data loss warning, use force
npm run db:push --force
```

#### Seed Database (Optional)
```bash
# Seed database with initial data
npm run db:seed
```

### 5. Running the Application

#### Development Mode
```bash
# Run Next.js app (apps/web)
cd apps/web && npm run dev
```

Or using turbo for all packages:
```bash
pnpm dev
```

The application will run at:
- **Frontend**: http://localhost:5000
- **Network**: http://0.0.0.0:5000 (for Replit environment)

#### Production Mode
```bash
# Build application
pnpm build

# Start production server
cd apps/web && npm start
```

## 🏗️ Project Structure

```
├── apps/web/                 # Next.js Application (Main App)
├── packages/
│   ├── core/                # Shared utilities
│   ├── db/                  # Database schema & migrations
│   ├── auth/                # Better-auth integration
│   ├── rbac/                # Role-based access control
│   ├── ui/                  # Shared UI components
│   └── modules/             # DDD business modules
│       ├── audit/
│       ├── authorization/
│       ├── dashboard/
│       ├── identity/
│       └── tenancy/
├── client/                  # Vite React client (legacy/alternative)
├── server/                  # Express server (legacy/alternative)
├── shared/                  # Shared schemas
└── docs/                    # Documentation & checklists
```

## 🔧 Important Configuration

### Database Schema
This project uses a comprehensive schema located at `packages/db/src/schema.ts` which includes:
- **Multi-tenant**: Tenants, Memberships
- **Authentication**: Users, Sessions, Accounts (better-auth compatible)
- **Authorization**: Roles, Permissions, Role-Permissions
- **Audit**: Audit Logs
- **API Management**: API Keys
- **Invitations**: Team invitations

### Authentication
Uses **better-auth** with features:
- Session management
- Multi-provider support
- Built-in security features
- TypeScript support

### Multi-Tenancy
- PostgreSQL Row Level Security (RLS)
- Tenant context in every transaction
- Dynamic tenant switching for superusers

## 🛠️ Troubleshooting

### Error: "next: Doesn't look like nmh is installed"
```bash
# Reinstall dependencies in apps/web
cd apps/web && pnpm install
```

### Error: Database connection
1. Ensure DATABASE_URL is correct
2. Make sure PostgreSQL is running
3. Test database connection
4. Run `npm run db:push` again

### Error: Dependencies conflict
```bash
# Clean install
rm -rf node_modules apps/web/node_modules
find packages -name node_modules -type d -exec rm -rf {} + 2>/dev/null || true
pnpm install
```

### Error: Permission denied on database
1. Ensure database user has sufficient permissions
2. For development, user should be able to CREATE TABLE, CREATE INDEX, etc.

### Port already in use
If port 5000 is already in use, edit `apps/web/package.json`:
```json
{
  "scripts": {
    "dev": "next dev -p 3000 -H 0.0.0.0"
  }
}
```

## 📚 Useful Commands

```bash
# Install dependencies
pnpm install

# Development
pnpm dev                    # Start all development servers
cd apps/web && npm run dev  # Start Next.js only

# Database
npm run db:push            # Push schema changes
npm run db:push --force    # Force push (if data loss warning)
npm run db:seed            # Seed database

# Build & Production
pnpm build                 # Build all packages
pnpm start                 # Start production servers

# Linting & Type checking
pnpm lint                  # Lint all packages
pnpm typecheck            # TypeScript checking

# Testing
pnpm test                  # Run all tests
```

## 🌐 Environment Specific

### Replit Environment
- Port 5000 configured automatically
- Host 0.0.0.0 for proxy support
- PostgreSQL database available automatically
- Environment variables already set up

### Local Development
- Manual PostgreSQL setup required
- Configure .env.local manually
- Port can be customized

## 📖 Further Documentation

For complete documentation, see the `docs/` folder:
- `architecture_overview.md` - Architecture overview
- `rls_checklist.md` - Row Level Security checklist
- `security_checklist.md` - Security checklist
- `features_checklist.md` - Features checklist

## 🔐 Security Features

This project implements:
- **Multi-tenant isolation** with PostgreSQL RLS
- **RBAC** with dynamic permissions
- **Audit logging** for all actions
- **Security headers** (CSP, HSTS, etc.)
- **Rate limiting**
- **Input validation** with Zod

## 🤖 For Replit Agents

### Key Points for Agents:
1. **Main Application**: The primary app is the Next.js application in `apps/web/`
2. **Schema Location**: Use the comprehensive schema at `packages/db/src/schema.ts`
3. **Port Configuration**: Always use port 5000 with host 0.0.0.0 for Replit environment
4. **Database**: PostgreSQL is auto-provisioned with environment variables
5. **Workflow Setup**: Configure workflow to run `cd apps/web && npm run dev`

### Agent Workflow Commands:
```bash
# Install dependencies
pnpm install

# Push database schema
npm run db:push

# Seed database with initial data
npm run db:seed

# Setup Next.js workflow
# Command: cd apps/web && npm run dev
# Port: 5000
# Output Type: webview
```

### Important Agent Considerations:
- Never modify ID column types in schema
- Use `npm run db:push --force` if schema push fails
- The main app runs on Next.js (apps/web), not the Vite client
- Database schema is comprehensive and includes multi-tenancy
- Better-auth is pre-configured for authentication

---

**Happy Coding! 🎉**

If you encounter any issues, please check the documentation in the `docs/` folder or create an issue in the repository.