'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const items = [
  {
    q: 'What can I use dynamic QR codes for?',
    a: 'Dynamic QR codes let you change the destination URL anytime without reprinting. Use them for menus, events, product info, landing pages, and campaigns. Scans are tracked so you can see performance.',
  },
  {
    q: 'Do I need technical skills to use QR Host?',
    a: 'No. Create a QR code in minutes: paste a URL, optionally add a logo or style, and download. Analytics are shown in simple dashboards—no coding required.',
  },
  {
    q: 'How is this different from free QR generators?',
    a: 'Free tools often create static, one-time codes. We offer dynamic codes you can edit later, scan analytics, bulk creation, and a dashboard to manage everything in one place.',
  },
  {
    q: 'Can I track scans and analytics?',
    a: 'Yes. Each QR code has its own analytics: total scans, unique visitors, device types, and timestamps. View trends over time to understand what’s working.',
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-20 lg:py-28 border-t border-border">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="font-serif text-3xl lg:text-4xl font-medium text-foreground mb-4">
          Questions? We&apos;ve got answers
        </h2>
        <p className="text-muted mb-12">
          Everything you need to know about creating and managing QR codes.
        </p>
        <div className="space-y-2">
          {items.map((item, i) => (
            <div
              key={i}
              className="border border-border rounded-lg overflow-hidden bg-white/[0.02]"
            >
              <button
                type="button"
                className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left text-foreground font-medium hover:bg-white/[0.03] transition-colors"
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                aria-expanded={openIndex === i}
              >
                {item.q}
                <ChevronDown
                  className={`w-5 h-5 shrink-0 text-muted transition-transform ${openIndex === i ? 'rotate-180' : ''}`}
                />
              </button>
              <div
                className={`grid transition-[grid-template-rows] duration-200 ${openIndex === i ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
              >
                <div className="overflow-hidden">
                  <p className="px-5 pb-4 pt-0 text-muted text-sm leading-relaxed">
                    {item.a}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
