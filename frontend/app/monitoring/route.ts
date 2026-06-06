import { getBugsinkDsn, getBugsinkEnvelopeUrl } from '@/lib/bugsink';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const dsn = getBugsinkDsn();
  if (!dsn) {
    return new Response('Bugsink is not configured', { status: 503 });
  }

  try {
    const envelope = await request.text();
    const response = await fetch(getBugsinkEnvelopeUrl(dsn), {
      method: 'POST',
      body: envelope,
      headers: {
        'Content-Type': 'application/x-sentry-envelope',
      },
    });

    return new Response(null, { status: response.status });
  } catch {
    return new Response('Failed to forward envelope to Bugsink', { status: 502 });
  }
}
