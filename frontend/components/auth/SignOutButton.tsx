'use client';

import { LogOut } from 'lucide-react';
import { useState } from 'react';

export function SignOutButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleSignOut = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      await fetch('/api/auth/signout', {
        method: 'POST',
        credentials: 'include',
      });
      window.location.href = '/auth/signin';
    } catch (error) {
      console.error('Sign out error:', error);
      window.location.href = '/auth/signin';
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleSignOut}
      disabled={isLoading}
      className="p-2 text-muted hover:text-foreground hover:bg-white/5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      title="Sign Out"
      aria-label="Sign Out"
      type="button"
    >
      <LogOut className="w-5 h-5" />
    </button>
  );
}
