import * as Sentry from '@sentry/nextjs';
import { setBugsinkUserFromSession } from '@/lib/bugsink-user.server';

export const dynamic = 'force-dynamic';

export async function GET() {
  await setBugsinkUserFromSession();

  const error = new Error('Bugsink server test error');

  Sentry.captureException(error);

  throw error;
}
