'use client';

import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/Button';

export function SignOutButton() {
  const handleSignOut = async () => {
    await signOut({ redirectTo: '/auth/signin' });
  };

  return (
    <Button variant="secondary" onClick={handleSignOut}>
      Sign Out
    </Button>
  );
}
