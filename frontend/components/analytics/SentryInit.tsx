'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';
import { getBugsinkClientInitOptions } from '@/lib/bugsink';

export function SentryInit() {
  useEffect(() => {
    if (Sentry.getClient()) {
      return;
    }

    Sentry.init(getBugsinkClientInitOptions());
  }, []);

  return null;
}
