import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { env } from '@/lib/env';

const SESSION_COOKIE_NAME = 'qr_session';

type SessionUser = {
  id: string;
  email: string;
  role: string;
  name?: string;
};

type Session = {
  user: SessionUser;
} | null;

export async function auth(): Promise<Session> {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, env.sessionSecret) as { user?: SessionUser };
    if (!decoded.user) {
      return null;
    }
    return { user: decoded.user };
  } catch {
    return null;
  }
}
