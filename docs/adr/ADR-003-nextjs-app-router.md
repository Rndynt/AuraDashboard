# ADR-003: Next.js App Router for Web Application

**Date:** 2024-01-15  
**Status:** Accepted  
**Deciders:** Frontend Team, Architecture Team  
**Technical Story:** Web application framework and routing strategy

## Context

The Dashboard Starter Kit needs a web application framework that can handle:

1. **Multi-Tenant Routing**: URLs like `/{tenant}/dashboard`, `/{tenant}/members`
2. **Authentication**: Protected routes, login/logout flows, session management
3. **Server-Side Rendering**: SEO-friendly pages with dynamic content
4. **API Routes**: Backend API endpoints co-located with frontend
5. **Performance**: Fast page loads, efficient caching, minimal JavaScript
6. **Developer Experience**: TypeScript support, hot reloading, good tooling
7. **Modern Features**: React Server Components, streaming, suspense

We need to choose between various React frameworks and routing approaches that can handle our multi-tenant architecture requirements.

## Decision

We will use **Next.js 14 with App Router** for the web application.

### Architecture Approach:
- **App Router**: Use Next.js App Router (not Pages Router)
- **File-Based Routing**: Leverage Next.js file-system routing
- **Route Groups**: Organize routes with (auth) and (app) groups
- **Dynamic Segments**: Use `[tenant]` for tenant-specific routes
- **API Routes**: Co-locate API endpoints in `app/api/` directory
- **Server Components**: Default to Server Components for better performance
- **Client Components**: Use Client Components only when needed for interactivity

### Route Structure:
