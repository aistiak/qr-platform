import * as Sentry from '@sentry/node';

type BugsinkUser = {
  id: string;
  email?: string;
  name?: string;
};

export function setBugsinkUser(user: BugsinkUser | null | undefined) {
  if (!user?.id) {
    Sentry.setUser(null);
    return;
  }

  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.name,
  });
}
