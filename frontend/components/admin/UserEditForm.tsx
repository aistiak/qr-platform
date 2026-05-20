'use client';

import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  qrCodeLimit: number;
  createdAt: string;
  updatedAt: string;
}

interface UserEditFormProps {
  userId: string;
}

export function UserEditForm({ userId }: UserEditFormProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [qrCodeLimit, setQrCodeLimit] = useState(20);

  useEffect(() => {
    fetchUser();
  }, [userId]);

  const fetchUser = async () => {
    try {
      setLoading(true);
      // Fetch all users and find the one we need
      const response = await fetch('/api/admin/users');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch users');
      }

      const foundUser = data.users.find((u: User) => u.id === userId);
      if (!foundUser) {
        throw new Error('User not found');
      }

      setUser(foundUser);
      setQrCodeLimit(foundUser.qrCodeLimit);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load user');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    setError('');

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrCodeLimit }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update user');
      }

      const data = await response.json();
      setUser(data);
      toast.success('User updated successfully');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error && !user) {
    return <ErrorMessage message={error} />;
  }

  if (!user) {
    return <ErrorMessage message="User not found" />;
  }

  return (
    <div className="space-y-6">
      {error && <ErrorMessage message={error} />}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-muted mb-2">Name</label>
          <Input id="name" value={user.name} disabled className="bg-white/5" />
        </div>

        <div>
          <label className="block text-sm font-medium text-muted mb-2">Email</label>
          <Input id="email" value={user.email} disabled className="bg-white/5" />
        </div>

        <div>
          <label className="block text-sm font-medium text-muted mb-2">Role</label>
          <Input
            id="role"
            value={user.role}
            disabled
            className="bg-white/5"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-muted mb-2">
            QR Code Limit
          </label>
          <Input
            id="qrCodeLimit"
            type="number"
            min="1"
            value={qrCodeLimit}
            onChange={(e) => setQrCodeLimit(parseInt(e.target.value, 10) || 1)}
            className="bg-white/5"
          />
          <p className="mt-1 text-sm text-muted">
            Maximum number of QR codes this user can create
          </p>
        </div>

        <div className="space-y-2 text-sm text-muted">
          <p>
            <span className="font-medium text-foreground">Created:</span>{' '}
            {new Date(user.createdAt).toLocaleString()}
          </p>
          <p>
            <span className="font-medium text-foreground">Last Updated:</span>{' '}
            {new Date(user.updatedAt).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={handleSave} loading={saving}>
          Save Changes
        </Button>
      </div>
    </div>
  );
}
