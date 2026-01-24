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
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6 mb-6">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white">Dashboard</h1>
              <p className="text-gray-300">Welcome, {session.user?.name || session.user?.email}</p>
            </div>
            <div className="flex gap-2">
              <Link href="/dashboard/qr/create">
                <Button>Create QR Code</Button>
              </Link>
              <SignOutButton />
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
          <h2 className="text-xl font-semibold mb-4 text-white">Your QR Codes</h2>
          <QRCodeList status="all" showArchived={true} />
        </div>
      </div>
    </div>
  );
}
