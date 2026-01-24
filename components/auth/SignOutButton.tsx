'use client';

import { signOut } from 'next-auth/react';
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
      // First, call the API endpoint to clear server-side cookies
      await fetch('/api/auth/signout', {
        method: 'POST',
        credentials: 'include',
      });
      
      // Then use NextAuth signOut to clear client-side session
      // Use redirect: true to ensure proper cleanup and redirect
      await signOut({ 
        redirect: true,
        callbackUrl: '/auth/signin' 
      });
    } catch (error) {
      console.error('Sign out error:', error);
      // If signOut fails, force a hard redirect to clear everything
      window.location.href = '/auth/signin';
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleSignOut}
      disabled={isLoading}
      className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      title="Sign Out"
      aria-label="Sign Out"
      type="button"
    >
      <LogOut className="w-5 h-5" />
    </button>
  );
}
