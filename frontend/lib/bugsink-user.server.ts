import { auth } from '@/lib/auth';
import { setBugsinkUser } from '@/lib/bugsink-user';

export async function setBugsinkUserFromSession() {
  const session = await auth();
  setBugsinkUser(session?.user ?? null);
}
