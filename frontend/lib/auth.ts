import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

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
    const secret =
      process.env.SESSION_SECRET || process.env.NEXTAUTH_SECRET || 'change-this-secret';
    const decoded = jwt.verify(token, secret) as { user?: SessionUser };
    if (!decoded.user) {
      return null;
    }
    return { user: decoded.user };
  } catch {
    return null;
  }
}
