export const DEFAULT_BUGSINK_DSN =
  'http://e7daceb8d378431b9e76f3c5abe34758@localhost:8000/1';

export function getBugsinkDsn(): string | undefined {
  const configured = process.env.NEXT_PUBLIC_BUGSINK_DSN;
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
  };
}
