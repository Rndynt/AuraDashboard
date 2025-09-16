'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@acme/auth/client';

export default function WelcomePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = await authClient.getSession();
        
        if (!session.data?.user) {
          router.push('/auth');
          return;
        }
        
        setUser(session.data.user);
      } catch (error) {
        console.error('Auth check error:', error);
        router.push('/auth');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight">Welcome, {user.name || user.email}!</h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Your multi-tenant application is ready to use
          </p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="flex flex-col space-y-1.5 p-6">
              <h3 className="text-2xl font-semibold leading-none tracking-tight">🏢 Multi-Tenant</h3>
              <p className="text-sm text-muted-foreground">Secure tenant isolation with RLS</p>
            </div>
            <div className="p-6 pt-0">
              <p className="text-sm text-muted-foreground">
                Row-level security ensures data isolation between tenants
              </p>
            </div>
          </div>
          
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="flex flex-col space-y-1.5 p-6">
              <h3 className="text-2xl font-semibold leading-none tracking-tight">🔐 RBAC Ready</h3>
              <p className="text-sm text-muted-foreground">Role-based access control</p>
            </div>
            <div className="p-6 pt-0">
              <p className="text-sm text-muted-foreground">
                Comprehensive permission system with audit logging
              </p>
            </div>
          </div>
          
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="flex flex-col space-y-1.5 p-6">
              <h3 className="text-2xl font-semibold leading-none tracking-tight">📊 Dashboard</h3>
              <p className="text-sm text-muted-foreground">Real-time analytics & insights</p>
            </div>
            <div className="p-6 pt-0">
              <p className="text-sm text-muted-foreground">
                Monitor tenant activity and system performance
              </p>
            </div>
          </div>
          
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="flex flex-col space-y-1.5 p-6">
              <h3 className="text-2xl font-semibold leading-none tracking-tight">🔑 API Keys</h3>
              <p className="text-sm text-muted-foreground">Secure API access management</p>
            </div>
            <div className="p-6 pt-0">
              <p className="text-sm text-muted-foreground">
                Generate and manage API keys for external integrations
              </p>
            </div>
          </div>
          
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="flex flex-col space-y-1.5 p-6">
              <h3 className="text-2xl font-semibold leading-none tracking-tight">👥 Team Management</h3>
              <p className="text-sm text-muted-foreground">Invite and manage team members</p>
            </div>
            <div className="p-6 pt-0">
              <p className="text-sm text-muted-foreground">
                Add team members with customizable role permissions
              </p>
            </div>
          </div>
          
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="flex flex-col space-y-1.5 p-6">
              <h3 className="text-2xl font-semibold leading-none tracking-tight">📋 Audit Logs</h3>
              <p className="text-sm text-muted-foreground">Complete activity tracking</p>
            </div>
            <div className="p-6 pt-0">
              <p className="text-sm text-muted-foreground">
                Monitor all tenant activities with detailed audit trails
              </p>
            </div>
          </div>
        </div>
        
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="flex flex-col space-y-1.5 p-6">
            <h3 className="text-2xl font-semibold leading-none tracking-tight">🚀 Get Started</h3>
            <p className="text-sm text-muted-foreground">Your enterprise-grade application is ready</p>
          </div>
          <div className="p-6 pt-0 space-y-4">
            <p className="text-sm text-muted-foreground">
              This is a fully-featured multi-tenant application with secure authentication, 
              role-based access control, and comprehensive audit logging. The system uses 
              row-level security to ensure complete data isolation between tenants.
            </p>
            <div className="flex gap-4">
              <button 
                onClick={() => router.push('/')}
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                data-testid="button-explore"
              >
                Explore Application
              </button>
              <button 
                onClick={() => window.open('/api/auth/sign-out', '_self')}
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                data-testid="button-signout"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}