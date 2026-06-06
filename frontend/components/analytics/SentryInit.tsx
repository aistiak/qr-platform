'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';
import { getBugsinkClientInitOptions } from '@/lib/bugsink';
import { identifyBugsinkUserOnClient } from '@/lib/bugsink-user';

export function SentryInit() {
  useEffect(() => {
    if (!Sentry.getClient()) {
      Sentry.init(getBugsinkClientInitOptions());
    }

    void identifyBugsinkUserOnClient();
  }, []);

  return null;
}
