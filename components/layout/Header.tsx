'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { SignOutButton } from '@/components/auth/SignOutButton';
import { Button } from '@/components/ui/Button';
import { Home, Menu } from 'lucide-react';
import { useState } from 'react';

export function Header() {
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="bg-background border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 lg:h-18">
          <Link
            href="/"
            className="text-xl font-bold text-foreground hover:opacity-90 transition-opacity tracking-tight"
          >
            QR Platform
          </Link>
          <nav className="hidden sm:flex items-center gap-6">
            {session ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-muted hover:text-foreground transition-colors p-2 rounded-lg hover:bg-white/5"
                  title="Dashboard"
                >
                  <Home className="w-5 h-5" />
                </Link>
                {session.user?.role === 'admin' && (
                  <Link href="/admin">
                    <Button variant="outline" size="sm">
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
                    Get started
                  </Button>
                </Link>
              </>
            )}
          </nav>
          <button
            type="button"
            className="sm:hidden p-2 text-foreground rounded-lg hover:bg-white/5"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
        {mobileOpen && (
          <div className="sm:hidden py-4 border-t border-border flex flex-col gap-2">
            {session ? (
              <>
                <Link href="/dashboard" className="py-2 text-foreground" onClick={() => setMobileOpen(false)}>
                  Dashboard
                </Link>
                {session.user?.role === 'admin' && (
                  <Link href="/admin" className="py-2 text-foreground" onClick={() => setMobileOpen(false)}>
                    Admin
                  </Link>
                )}
                <SignOutButton />
              </>
            ) : (
              <>
                <Link href="/auth/signin" className="py-2 text-foreground" onClick={() => setMobileOpen(false)}>
                  Sign In
                </Link>
                <Link href="/auth/signup" className="py-2" onClick={() => setMobileOpen(false)}>
                  <Button size="sm" className="w-full">Get started</Button>
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
