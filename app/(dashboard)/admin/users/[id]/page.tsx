import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { UserEditForm } from '@/components/admin/UserEditForm';
import { Card } from '@/components/ui/Card';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default async function AdminUserDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();

  if (!session) {
    redirect('/auth/signin');
  }

  if (session.user?.role !== 'admin') {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-4">
          <Link href="/admin/users">
            <Button variant="secondary" size="sm">
              ← Back to Users
            </Button>
          </Link>
        </div>

        <Card>
          <h1 className="text-2xl font-bold mb-6 text-white">Edit User</h1>
          <UserEditForm userId={params.id} />
        </Card>
      </div>
    </div>
  );
}
