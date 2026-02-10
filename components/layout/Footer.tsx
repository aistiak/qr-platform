'use client';

import Link from 'next/link';

const solutions = [
  { label: 'Dynamic QR codes', href: '/dashboard/qr/create' },
  { label: 'Analytics & tracking', href: '/dashboard' },
  { label: 'Bulk generation', href: '/dashboard/qr/create' },
];

const company = [
  { label: 'About', href: '#' },
  { label: 'Contact', href: '#' },
];

const legal = [
  { label: 'Privacy', href: '#' },
  { label: 'Terms', href: '#' },
];

export function Footer() {
  return (
    <footer className="bg-background border-t border-border mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">Solutions</h3>
            <ul className="space-y-3">
              {solutions.map(({ label, href }) => (
                <li key={label}>
                  <Link href={href} className="text-muted hover:text-foreground text-sm transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">Company</h3>
            <ul className="space-y-3">
              {company.map(({ label, href }) => (
                <li key={label}>
                  <Link href={href} className="text-muted hover:text-foreground text-sm transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">Legal</h3>
            <ul className="space-y-3">
              {legal.map(({ label, href }) => (
                <li key={label}>
                  <Link href={href} className="text-muted hover:text-foreground text-sm transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="col-span-2 md:col-span-1 flex flex-col justify-end">
            <Link href="/" className="text-lg font-bold text-foreground mb-4">
              QR Platform
            </Link>
            <p className="text-muted text-sm">
              Create, manage, and track QR codes at scale.
            </p>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-border text-center text-muted text-sm">
          <p>&copy; {new Date().getFullYear()} QR Platform. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
