'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@acme/auth/src/client.js';
import type { User } from '@acme/auth/src/auth.js';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

export function ProtectedRoute({ 
  children, 
  fallback = <div>Loading...</div>,
  redirectTo = '/auth'
}: ProtectedRouteProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = await authClient.getSession();
        if (session.data?.user) {
          setUser(session.data.user);
        } else {
          router.push(redirectTo);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push(redirectTo);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router, redirectTo]);

  if (loading) {
    return <>{fallback}</>;
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
