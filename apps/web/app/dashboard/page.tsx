'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@acme/auth/client';

export default function DashboardRedirectPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      try {
        const session = await authClient.getSession();
        
        if (!session.data?.user) {
          router.push('/auth');
          return;
        }

        // For now, just redirect to welcome page
        // Later can add API call to fetch user's first tenant
        router.push('/welcome');
      } catch (error) {
        console.error('Dashboard redirect error:', error);
        router.push('/auth');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuthAndRedirect();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return null;
}
