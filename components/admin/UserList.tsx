'use client';

import { useEffect, useState } from 'react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  qrCodeLimit: number;
  createdAt: string;
  updatedAt: string;
}

export function UserList() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/users');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch users');
      }

      setUsers(data.users || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-300">No users found.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-gray-700">
            <th className="pb-3 text-sm font-semibold text-gray-300">Name</th>
            <th className="pb-3 text-sm font-semibold text-gray-300">Email</th>
            <th className="pb-3 text-sm font-semibold text-gray-300">Role</th>
            <th className="pb-3 text-sm font-semibold text-gray-300">QR Code Limit</th>
            <th className="pb-3 text-sm font-semibold text-gray-300">Created</th>
            <th className="pb-3 text-sm font-semibold text-gray-300">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="border-b border-gray-700 hover:bg-gray-700/50">
              <td className="py-3 text-gray-300">{user.name}</td>
              <td className="py-3 text-gray-300">{user.email}</td>
              <td className="py-3">
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    user.role === 'admin'
                      ? 'bg-purple-900 text-purple-300'
                      : 'bg-gray-700 text-gray-300'
                  }`}
                >
                  {user.role}
                </span>
              </td>
              <td className="py-3 text-gray-300">{user.qrCodeLimit}</td>
              <td className="py-3 text-gray-300">
                {new Date(user.createdAt).toLocaleDateString()}
              </td>
              <td className="py-3">
                <Link href={`/admin/users/${user.id}`}>
                  <Button variant="secondary" size="sm">
                    Edit
                  </Button>
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
