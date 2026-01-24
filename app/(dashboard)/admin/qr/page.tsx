import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { AdminQRCodeList } from '@/components/admin/AdminQRCodeList';
import { Card } from '@/components/ui/Card';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default async function AdminQRCodesPage() {
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
        <div className="mb-4">
          <Link href="/admin">
            <Button variant="secondary" size="sm">
              ← Back to Admin Dashboard
            </Button>
          </Link>
        </div>

        <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6 mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">All QR Codes</h1>
          <p className="text-gray-300">View all QR codes created by all users</p>
        </div>

        <Card>
          <AdminQRCodeList />
        </Card>
      </div>
    </div>
  );
}
