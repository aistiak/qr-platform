import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { QRCodeList } from '@/components/qr/QRCodeList';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect('/auth/signin');
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white/[0.03] rounded-xl border border-border p-6 mb-6">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <h1 className="font-serif text-2xl font-semibold text-foreground">Dashboard</h1>
              <p className="text-muted">Welcome, {session.user?.name || session.user?.email}</p>
            </div>
            <div className="flex gap-2">
              <Link href="/dashboard/qr/create">
                <Button>Create QR Code</Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-white/[0.03] rounded-xl border border-border p-6">
          <h2 className="text-xl font-semibold mb-4 text-foreground">Your QR Codes</h2>
          <QRCodeList status="all" showArchived={true} />
        </div>
      </div>
    </div>
  );
}
