# Panduan Instalasi Dashboard Starter Kit

Panduan lengkap untuk menginstall dan menjalankan Dashboard Starter Kit setelah clone dari repository.

## 📋 Prerequisites

Pastikan sistem Anda sudah memiliki:

### Software Wajib
- **Node.js** versi 18 atau lebih baru
- **pnpm** sebagai package manager (direkomendasikan)
  ```bash
  npm install -g pnpm
  ```

### Database
- **PostgreSQL** database (bisa lokal atau cloud seperti Neon, Supabase, dll)

## 🚀 Langkah Instalasi

### 1. Clone Repository
```bash
git clone <repository-url>
cd dashboard-starter-kit
```

### 2. Install Dependencies
```bash
# Install semua dependencies untuk monorepo
pnpm install
```

> **Catatan**: Jika muncul warning tentang build scripts, jalankan `pnpm approve-builds` jika diperlukan.

### 3. Setup Environment Variables

Buat file `.env.local` di root project:

```bash
cp .env.example .env.local
```

Edit `.env.local` dan isi dengan konfigurasi database Anda:

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@host:port/database_name"

# Auth Configuration (opsional untuk development)
AUTH_SECRET="your-auth-secret-key"
AUTH_URL="http://localhost:5000"

# Other environment variables
NODE_ENV="development"
```

### 4. Setup Database

#### Untuk Environment Replit
Database PostgreSQL sudah tersedia secara otomatis dengan environment variables:
- `DATABASE_URL`
- `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`, `PGHOST`

#### Untuk Environment Lokal
Pastikan PostgreSQL berjalan dan database sudah dibuat.

#### Push Schema ke Database
```bash
# Push schema ke database
npm run db:push

# Jika ada warning data loss, gunakan force
npm run db:push --force
```

#### Seed Database (Opsional)
```bash
# Seed database dengan data awal
npm run db:seed
```

### 5. Menjalankan Aplikasi

#### Development Mode
```bash
# Menjalankan Next.js app (apps/web)
cd apps/web && npm run dev
```

Atau menggunakan turbo untuk semua packages:
```bash
pnpm dev
```

Aplikasi akan berjalan di:
- **Frontend**: http://localhost:5000
- **Network**: http://0.0.0.0:5000 (untuk Replit environment)

#### Production Mode
```bash
# Build aplikasi
pnpm build

# Start production server
cd apps/web && npm start
```

## 🏗️ Struktur Project

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

## 🔧 Konfigurasi Penting

### Schema Database
Project ini menggunakan schema yang lengkap di `packages/db/src/schema.ts` yang mencakup:
- **Multi-tenant**: Tenants, Memberships
- **Authentication**: Users, Sessions, Accounts (better-auth compatible)
- **Authorization**: Roles, Permissions, Role-Permissions
- **Audit**: Audit Logs
- **API Management**: API Keys
- **Invitations**: Team invitations

### Autentikasi
Menggunakan **better-auth** dengan fitur:
- Session management
- Multi-provider support
- Built-in security features
- TypeScript support

### Multi-Tenancy
- PostgreSQL Row Level Security (RLS)
- Tenant context dalam setiap transaction
- Dynamic tenant switching untuk superuser

## 🛠️ Troubleshooting

### Error: "next: Doesn't look like nmh is installed"
```bash
# Reinstall dependencies di apps/web
cd apps/web && pnpm install
```

### Error: Database connection
1. Pastikan DATABASE_URL benar
2. Pastikan PostgreSQL berjalan
3. Test koneksi database
4. Jalankan `npm run db:push` lagi

### Error: Dependencies conflict
```bash
# Clean install
rm -rf node_modules apps/web/node_modules
find packages -name node_modules -type d -exec rm -rf {} + 2>/dev/null || true
pnpm install
```

### Error: Permission denied pada database
1. Pastikan user database memiliki permission yang cukup
2. Untuk development, user harus bisa CREATE TABLE, CREATE INDEX, dll

### Port sudah digunakan
Jika port 5000 sudah digunakan, edit `apps/web/package.json`:
```json
{
  "scripts": {
    "dev": "next dev -p 3000 -H 0.0.0.0"
  }
}
```

## 📚 Perintah Berguna

```bash
# Install dependencies
pnpm install

# Development
pnpm dev                    # Start all development servers
cd apps/web && npm run dev  # Start Next.js only

# Database
npm run db:push            # Push schema changes
npm run db:push --force    # Force push (jika ada data loss warning)
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

## 🌐 Environment Khusus

### Replit Environment
- Port 5000 sudah dikonfigurasi otomatis
- Host 0.0.0.0 untuk proxy support
- Database PostgreSQL tersedia otomatis
- Environment variables sudah di-setup

### Local Development
- Butuh setup PostgreSQL manual
- Konfigurasi .env.local sendiri
- Port bisa disesuaikan

## 📖 Dokumentasi Lanjutan

Untuk dokumentasi lengkap, lihat folder `docs/`:
- `architecture_overview.md` - Overview arsitektur
- `rls_checklist.md` - Row Level Security checklist
- `security_checklist.md` - Security checklist
- `features_checklist.md` - Features checklist

## 🔐 Keamanan

Project ini mengimplementasikan:
- **Multi-tenant isolation** dengan PostgreSQL RLS
- **RBAC** dengan dynamic permissions
- **Audit logging** untuk semua actions
- **Security headers** (CSP, HSTS, dll)
- **Rate limiting**
- **Input validation** dengan Zod

---

**Happy Coding! 🎉**

Jika ada masalah, silakan check dokumentasi di folder `docs/` atau buat issue di repository.