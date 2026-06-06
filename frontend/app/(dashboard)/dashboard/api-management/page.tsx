import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { ApiTokenManager } from '@/components/platform/ApiTokenManager';

export default async function ApiManagementPage() {
  const session = await auth();
  if (!session) {
    redirect('/auth/signin');
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="bg-white/[0.03] rounded-xl border border-border p-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="font-serif text-2xl font-semibold text-foreground">API Management</h1>
              <p className="text-muted">
                Create and manage API tokens with fine-grained permissions for QR APIs.
              </p>
            </div>
            <Link href="/dashboard">
              <Button variant="outline" size="sm">
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>

        <ApiTokenManager />
      </div>
    </div>
  );
}
