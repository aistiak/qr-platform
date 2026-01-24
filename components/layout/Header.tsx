'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { SignOutButton } from '@/components/auth/SignOutButton';
import { Button } from '@/components/ui/Button';

export function Header() {
  const { data: session } = useSession();

  return (
    <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-white hover:text-gray-300 transition-colors">
              QR Platform
            </Link>
          </div>
          <nav className="flex items-center gap-4">
            {session ? (
              <>
                <Link href="/dashboard">
                  <Button variant="secondary" size="sm">
                    Dashboard
                  </Button>
                </Link>
                {session.user?.role === 'admin' && (
                  <Link href="/admin">
                    <Button variant="secondary" size="sm">
                      Admin
                    </Button>
                  </Link>
                )}
                <SignOutButton />
              </>
            ) : (
              <>
                <Link href="/auth/signin">
                  <Button variant="secondary" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button size="sm">
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
