import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { setBugsinkUser } from '@/lib/bugsink-user';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect('/auth/signin');
  }

  setBugsinkUser(session.user);

  return <>{children}</>;
}
