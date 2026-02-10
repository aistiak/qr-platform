import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { FAQ } from '@/components/landing/FAQ';
import {
  QrCode,
  BarChart3,
  Link2,
  Zap,
  Shield,
  Layers,
} from 'lucide-react';

export default async function Home() {
  const session = await auth();

  if (session) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative px-4 sm:px-6 lg:px-8 pt-16 pb-24 lg:pt-24 lg:pb-32 max-w-5xl mx-auto">
        <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-medium text-foreground leading-[1.15] max-w-3xl">
          When you need a link everywhere,
          <br />
          <span className="font-semibold italic">we help you get there.</span>
        </h1>
        <p className="mt-6 text-lg sm:text-xl text-muted max-w-xl leading-relaxed">
          Create, manage, and track QR codes with ease. Dynamic links, real-time
          analytics, and bulk generation—all in one place.
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <Link href="/auth/signup">
            <Button size="lg" className="min-w-[160px]">
              Get started
            </Button>
          </Link>
          <Link href="/auth/signin">
            <Button variant="secondary" size="lg" className="min-w-[160px]">
              Sign In
            </Button>
          </Link>
        </div>
      </section>

      {/* Stats strip */}
      <section className="border-y border-border py-8 lg:py-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-muted text-sm uppercase tracking-wider mb-6">
            Create & track at scale
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12 text-center">
            <div>
              <p className="font-serif text-3xl lg:text-4xl font-medium text-foreground">
                Dynamic
              </p>
              <p className="text-muted text-sm mt-1">Edit destination anytime</p>
            </div>
            <div>
              <p className="font-serif text-3xl lg:text-4xl font-medium text-foreground">
                Tracked
              </p>
              <p className="text-muted text-sm mt-1">Scans & analytics</p>
            </div>
            <div className="col-span-2 lg:col-span-1">
              <p className="font-serif text-3xl lg:text-4xl font-medium text-foreground">
                Simple
              </p>
              <p className="text-muted text-sm mt-1">No code required</p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 lg:py-28 border-t border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-muted text-sm uppercase tracking-wider mb-4">
            How it works
          </p>
          <h2 className="font-serif text-3xl lg:text-4xl font-medium text-foreground max-w-2xl mb-16">
            From link to QR to insights in three steps
          </h2>
          <div className="grid md:grid-cols-3 gap-10 lg:gap-14">
            <div>
              <div className="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center mb-5">
                <Link2 className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-semibold text-foreground text-lg mb-2">
                Create
              </h3>
              <p className="text-muted text-sm leading-relaxed">
                Paste any URL, add an optional logo or style, and generate your
                QR code. Dynamic codes let you change the link later without
                reprinting.
              </p>
            </div>
            <div>
              <div className="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center mb-5">
                <QrCode className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-semibold text-foreground text-lg mb-2">
                Customize & share
              </h3>
              <p className="text-muted text-sm leading-relaxed">
                Download in PNG or SVG. Use one link everywhere—menus, packaging,
                events, or campaigns. One code, one dashboard.
              </p>
            </div>
            <div>
              <div className="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center mb-5">
                <BarChart3 className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-semibold text-foreground text-lg mb-2">
                Track
              </h3>
              <p className="text-muted text-sm leading-relaxed">
                See total scans, unique visitors, and trends over time. Understand
                what’s working and optimize your campaigns.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What's inside */}
      <section className="py-20 lg:py-28 border-t border-border bg-white/[0.02]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-muted text-sm uppercase tracking-wider mb-4">
            What&apos;s inside
          </p>
          <h2 className="font-serif text-3xl lg:text-4xl font-medium text-foreground max-w-2xl mb-16">
            The QR platform built for creators and teams
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Zap,
                title: 'Dynamic QR codes',
                desc: 'Change the destination URL anytime. No need to reprint or replace codes.',
              },
              {
                icon: BarChart3,
                title: 'Analytics',
                desc: 'Track scans, unique visitors, and trends. See performance at a glance.',
              },
              {
                icon: Layers,
                title: 'Bulk & manage',
                desc: 'Create and organize multiple QR codes from one dashboard.',
              },
              {
                icon: Shield,
                title: 'Reliable links',
                desc: 'Short, stable URLs that redirect correctly every time.',
              },
              {
                icon: QrCode,
                title: 'Custom styling',
                desc: 'Add logos and adjust colors so your codes match your brand.',
              },
              {
                icon: Link2,
                title: 'One dashboard',
                desc: 'All your QR codes, analytics, and settings in a single place.',
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="p-5 rounded-xl border border-border bg-background hover:border-white/20 transition-colors"
              >
                <Icon className="w-6 h-6 text-accent mb-3" />
                <h3 className="font-semibold text-foreground mb-2">{title}</h3>
                <p className="text-muted text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <FAQ />

      {/* Final CTA */}
      <section className="py-20 lg:py-28 border-t border-border">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-serif text-3xl lg:text-4xl font-medium text-foreground mb-4">
            Create and track QR codes, simply
          </h2>
          <p className="text-muted text-lg mb-10">
            Get started in minutes. No credit card required.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/auth/signup">
              <Button size="lg">Get started</Button>
            </Link>
            <Link href="/auth/signin">
              <Button variant="secondary" size="lg">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
