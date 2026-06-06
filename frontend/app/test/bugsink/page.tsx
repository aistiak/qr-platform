'use client';

import * as Sentry from '@sentry/nextjs';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { BUGSINK_TUNNEL_PATH } from '@/lib/bugsink';

export default function BugsinkTestPage() {
  const [status, setStatus] = useState<string | null>(null);

  const captureClientException = async () => {
    if (!Sentry.getClient()) {
      setStatus('Sentry client is not initialized yet. Reload the page and try again.');
      return;
    }

    const eventId = Sentry.captureException(new Error('Bugsink client test error'));
    await Sentry.flush(2000);

    setStatus(
      eventId
        ? `Sent client exception (${eventId}). Check Network for POST ${BUGSINK_TUNNEL_PATH}.`
        : 'captureException returned no event id.',
    );
  };

  const throwClientError = () => {
    throw new Error('Bugsink uncaught client test error');
  };

  const triggerServerError = async () => {
    setStatus('Calling server test route...');

    const response = await fetch('/test/bugsink/server');

    if (!response.ok) {
      setStatus(`Server test route returned ${response.status} (check Bugsink dashboard)`);
      return;
    }

    setStatus('Server route returned without error');
  };

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6 px-4 py-16">
      <div>
        <h1 className="text-2xl font-semibold">Bugsink test</h1>
        <p className="mt-2 text-muted">
          Trigger test errors and verify they appear in your Bugsink dashboard.
        </p>
        <p className="mt-2 text-sm text-muted">
          Client events are sent via <code>{BUGSINK_TUNNEL_PATH}</code> to avoid browser blocking.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <Button onClick={() => void captureClientException()}>Capture client exception</Button>
        <Button variant="outline" onClick={throwClientError}>
          Throw uncaught client error
        </Button>
        <Button variant="secondary" onClick={() => void triggerServerError()}>
          Trigger server error
        </Button>
      </div>

      {status ? <p className="text-sm text-muted">{status}</p> : null}
    </div>
  );
}
