import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { SignOutButton } from '@/components/auth/SignOutButton';
import { QRCodeList } from '@/components/qr/QRCodeList';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect('/auth/signin');
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold">Dashboard</h1>
              <p className="text-gray-600">Welcome, {session.user?.name || session.user?.email}</p>
            </div>
            <div className="flex gap-2">
              <Link href="/dashboard/qr/create">
                <Button>Create QR Code</Button>
              </Link>
              <SignOutButton />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Your QR Codes</h2>
          <QRCodeList status="active" showArchived={true} />
        </div>
      </div>
    </div>
  );
}
