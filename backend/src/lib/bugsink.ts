export const DEFAULT_BUGSINK_DSN =
  'http://87f465a1cf7d4c189f4babe0216f46cd@localhost:8000/2';

export function getBugsinkDsn(): string | undefined {
  const configured = process.env.BUGSINK_DSN;
  if (configured === '') {
    return undefined;
  }

  return configured ?? DEFAULT_BUGSINK_DSN;
}

export function getBugsinkInitOptions() {
  const dsn = getBugsinkDsn();

  return {
    dsn,
    enabled: Boolean(dsn),
    environment: process.env.NODE_ENV,
    tracesSampleRate: process.env.NODE_ENV === 'development' ? 1.0 : 0.1,
    debug: process.env.NODE_ENV === 'development',
  };
}
