import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default async function AdminDashboardPage() {
  const session = await auth();

  if (!session) {
    redirect('/auth/signin');
  }

  if (session.user?.role !== 'admin') {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white/[0.03] rounded-xl border border-border p-6 mb-6">
          <h1 className="font-serif text-2xl font-semibold text-foreground mb-2">Admin Dashboard</h1>
          <p className="text-muted">Platform management and oversight</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <h2 className="text-xl font-semibold mb-4 text-foreground">Users</h2>
            <p className="text-muted mb-4">View and manage all platform users</p>
            <Link href="/admin/users">
              <Button>Manage Users</Button>
            </Link>
          </Card>

          <Card>
            <h2 className="text-xl font-semibold mb-4 text-foreground">QR Codes</h2>
            <p className="text-muted mb-4">View all QR codes across the platform</p>
            <Link href="/admin/qr">
              <Button>View All QR Codes</Button>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
