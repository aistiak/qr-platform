'use client';

import Script from 'next/script';
import { useCallback, useEffect } from 'react';

const UMAMI_HOST =
  process.env.NEXT_PUBLIC_UMAMI_HOST ?? 'https://analytics.krftlabs.com';
const UMAMI_WEBSITE_ID =
  process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID ??
  '55d984f1-bcef-4a22-a268-967d304c73c9';

async function identifyLoggedInUser() {
  if (!window.umami) {
    return;
  }

  try {
    const response = await fetch('/api/auth/session', { credentials: 'include' });
    if (!response.ok) {
      return;
    }

    const session = await response.json();
    if (session?.user?.id) {
      window.umami.identify({ id: session.user.id });
    }
  } catch {
    // Analytics should never break the app
  }
}

export function UmamiAnalytics() {
  const onScriptLoad = useCallback(() => {
    void identifyLoggedInUser();
  }, []);

  useEffect(() => {
    void identifyLoggedInUser();
  }, []);

  if (!UMAMI_WEBSITE_ID) {
    return null;
  }

  return (
    <>
      <Script
        defer
        src={`${UMAMI_HOST}/script.js`}
        data-website-id={UMAMI_WEBSITE_ID}
        strategy="afterInteractive"
        onLoad={onScriptLoad}
      />
      <Script
        defer
        src={`${UMAMI_HOST}/recorder.js`}
        data-website-id={UMAMI_WEBSITE_ID}
        data-sample-rate="0.15"
        data-mask-level="moderate"
        data-max-duration="300000"
        strategy="afterInteractive"
      />
    </>
  );
}
