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
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6 mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">Admin Dashboard</h1>
          <p className="text-gray-300">Platform management and oversight</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <h2 className="text-xl font-semibold mb-4 text-white">Users</h2>
            <p className="text-gray-300 mb-4">View and manage all platform users</p>
            <Link href="/admin/users">
              <Button>Manage Users</Button>
            </Link>
          </Card>

          <Card>
            <h2 className="text-xl font-semibold mb-4 text-white">QR Codes</h2>
            <p className="text-gray-300 mb-4">View all QR codes across the platform</p>
            <Link href="/admin/qr">
              <Button>View All QR Codes</Button>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
