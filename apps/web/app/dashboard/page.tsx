import { redirect } from 'next/navigation';
import { auth } from '@acme/auth';
import { headers } from 'next/headers';
import { db, memberships, tenants } from '@acme/db';
import { eq } from 'drizzle-orm';

export default async function DashboardRedirectPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect('/auth');
  }

  // Find user's first tenant to redirect to
  const [userMembership] = await db
    .select({
      tenant: {
        slug: tenants.slug,
      },
    })
    .from(memberships)
    .innerJoin(tenants, eq(memberships.tenantId, tenants.id))
    .where(eq(memberships.userId, session.user.id))
    .limit(1);

  if (userMembership) {
    redirect(`/${userMembership.tenant.slug}/dashboard`);
  }

  // If user has no tenant memberships, redirect to tenant selection or creation
  redirect('/welcome');
}
