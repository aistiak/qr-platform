import * as Sentry from '@sentry/nextjs';

type BugsinkUser = {
  id: string;
  email?: string;
  name?: string | null;
};

export function setBugsinkUser(user: BugsinkUser | null | undefined) {
  if (!user?.id) {
    Sentry.setUser(null);
    return;
  }

  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.name ?? undefined,
  });
}

export async function identifyBugsinkUserOnClient() {
  try {
    const response = await fetch('/api/auth/session', { credentials: 'include' });
    if (!response.ok) {
      setBugsinkUser(null);
      return;
    }

    const session = await response.json();
    setBugsinkUser(session?.user ?? null);
  } catch {
    // Error tracking should never break the app
  }
}
