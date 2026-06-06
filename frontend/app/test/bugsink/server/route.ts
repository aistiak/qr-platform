import * as Sentry from '@sentry/nextjs';

export const dynamic = 'force-dynamic';

export async function GET() {
  const error = new Error('Bugsink server test error');

  Sentry.captureException(error);

  throw error;
}
