import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect('/auth/signin');
  }

  // Debug logging in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[AdminLayout] Session user role:', session.user?.role);
    console.log('[AdminLayout] Session user:', {
      id: session.user?.id,
      email: session.user?.email,
      role: session.user?.role,
    });
  }

  if (session.user?.role !== 'admin') {
    if (process.env.NODE_ENV === 'development') {
      console.log('[AdminLayout] User is not admin, redirecting to dashboard');
    }
    redirect('/dashboard');
  }

  return <>{children}</>;
}
