import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

export const SESSION_COOKIE_NAME = 'qr_session';

type SessionUser = {
  id: string;
  email: string;
  role: string;
  name?: string;
};

type SessionToken = {
  user: SessionUser;
};

function getSessionSecret(): string {
  return process.env.SESSION_SECRET || process.env.NEXTAUTH_SECRET || 'change-this-secret';
}

export function signSessionToken(user: SessionUser): string {
  const token: SessionToken = { user };
  return jwt.sign(token, getSessionSecret(), { expiresIn: '30d' });
}

export function verifySessionToken(token: string): SessionUser | null {
  try {
    const decoded = jwt.verify(token, getSessionSecret()) as SessionToken;
    return decoded.user;
  } catch {
    return null;
  }
}

export function setSessionCookie(res: Response, token: string) {
  res.cookie(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
}

export function clearSessionCookie(res: Response) {
  res.clearCookie(SESSION_COOKIE_NAME, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });
}

export function attachSessionUser(req: Request, _res: Response, next: NextFunction) {
  const token = req.cookies?.[SESSION_COOKIE_NAME];
  if (token) {
    const user = verifySessionToken(token);
    if (user) {
      req.user = user;
    }
  }
  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }
  next();
}
