'use client';

import { signOut } from 'next-auth/react';
import { LogOut } from 'lucide-react';

export function SignOutButton() {
  const handleSignOut = async () => {
    await signOut({ redirectTo: '/auth/signin' });
  };

  return (
    <button
      onClick={handleSignOut}
      className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
      title="Sign Out"
      aria-label="Sign Out"
    >
      <LogOut className="w-5 h-5" />
    </button>
  );
}
