import { redirect } from 'next/navigation';
import { auth } from '@acme/auth';
import { headers } from 'next/headers';

export default async function HomePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect('/auth');
  }

  // Redirect to first tenant or tenant selection
  redirect('/dashboard');
}
